# /// script
# requires-python = ">=3.9"
# dependencies = ["boto3"]
# ///
"""Loads the prepared csvs into the local DynamoDB tables."""

import argparse
import csv
import os
import time
from pathlib import Path

import boto3

HERE = Path(__file__).parent
ADD_HEADERS_OUT = HERE.parent / "local_add_headers" / "out"

# Csv name -> the key that names its table in modules/dynamodb. The real table name carries a
# prefix and a release suffix that both change, so it is looked up instead of hardcoded.
TABLES = {
    "Motivos": "motivos",
    "Cnaes": "cnaes",
    "Naturezas": "naturezas_juridicas",
    "Qualificacoes": "qualificacoes_de_socios",
    "Municipios": "municipios",
    "Paises": "paises",
    "Simples": "dados_do_simples",
    "Empresas": "empresas",
    # Partitioned only on cnpj_basico, so a company with several partners keeps whichever
    # row lands last until the table gains a sort key.
    "Socios": "socios",
    "Estabelecimentos": "estabelecimentos",
}

REPORT_EVERY = 1_000_000


def table_name(client, key):
    matches = [n for n in client.list_tables()["TableNames"] if f"-{key}-" in n]
    if len(matches) != 1:
        raise SystemExit(f"{key}: expected one table, found {sorted(matches) or 'none'}")
    return matches[0]


def wanted(row, prefix):
    """Whether a row passes the cnpj_basico prefix.

    Every big dump carries cnpj_basico, so one prefix cuts the same companies out of all of
    them. The lookup tables have no such column and always come in whole.
    """
    if not prefix or "cnpj_basico" not in row:
        return True
    return (row["cnpj_basico"] or "").startswith(prefix)


def to_item(key, row):
    # estabelecimentos is keyed by the full cnpj, which the dump splits in three columns.
    if key == "estabelecimentos":
        row["cnpj"] = row["cnpj_basico"] + row["cnpj_ordem"] + row["cnpj_dv"]
    return row


def load(table, key, csv_path, prefix):
    read = loaded = 0
    started = time.monotonic()

    with csv_path.open(encoding="latin-1", newline="") as fh, table.batch_writer() as batch:
        for row in csv.DictReader(fh, delimiter=";"):
            read += 1
            # Reported on rows read, not rows kept: with a prefix almost everything is
            # dropped and the run would otherwise sit silent for minutes.
            if read % REPORT_EVERY == 0:
                print(f"    {read:,} read, {loaded:,} kept…", flush=True)
            if not wanted(row, prefix):
                continue
            batch.put_item(Item=to_item(key, row))
            loaded += 1

    elapsed = time.monotonic() - started
    return f"{csv_path.name} — {loaded:,} rows loaded, {read:,} read in {elapsed:.0f}s"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--in", dest="src", type=Path, default=ADD_HEADERS_OUT, help="folder holding the csvs")
    parser.add_argument("--prefix", default="", help="only rows whose cnpj_basico starts with this")
    parser.add_argument("--endpoint", default=os.environ.get("AWS_ENDPOINT_URL", "http://localhost:4566"))
    args = parser.parse_args()

    os.environ.setdefault("AWS_ACCESS_KEY_ID", "test")
    os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "test")
    os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")

    client = boto3.client("dynamodb", endpoint_url=args.endpoint)
    resource = boto3.resource("dynamodb", endpoint_url=args.endpoint)

    csvs = sorted(args.src.glob("*.csv"))
    if not csvs:
        raise SystemExit(f"no .csv in {args.src}")

    for csv_path in csvs:
        # Empresas, Socios and Estabelecimentos come in ten numbered parts.
        key = TABLES.get(csv_path.stem.rstrip("0123456789"))
        if key is None:
            print(f"skipped {csv_path.name} — no table configured")
            continue

        table = resource.Table(table_name(client, key))
        print(load(table, key, csv_path, args.prefix))


if __name__ == "__main__":
    main()
