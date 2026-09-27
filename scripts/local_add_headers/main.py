# /// script
# requires-python = ">=3.9"
# ///
"""Writes the header row the Receita Federal CNPJ zips are missing."""

import argparse
import csv
import zipfile
from pathlib import Path

from handlers import HEADERS

HERE = Path(__file__).parent


def header_for(name):
    if name in HEADERS:
        return HEADERS[name]

    # Empresas, Socios and Estabelecimentos are published in ten numbered parts that share
    # one layout, so the digits are the only thing separating them.
    return HEADERS.get(name.rstrip("0123456789"))


def records(stream):
    """Yields (fields, raw, line) per csv record.

    A quoted field can hold a real newline — complemento does — so a record does not always end
    at a line break. csv.reader is what finds the end; keeping the raw bytes beside it lets the
    copy stay byte for byte.
    """
    raw_lines = []

    def lines():
        for line in stream:
            raw_lines.append(line)
            yield line.decode("latin-1")

    reader = csv.reader(lines(), delimiter=";")
    for fields in reader:
        raw = b"".join(raw_lines)
        raw_lines.clear()
        yield fields, raw, reader.line_num


def annotate(zip_path, out_dir):
    name = zip_path.stem
    header = header_for(name)
    if header is None:
        return f"skipped {zip_path.name} — no header defined"

    with zipfile.ZipFile(zip_path) as zf:
        members = [m for m in zf.namelist() if not m.endswith("/")]
        if len(members) != 1:
            raise SystemExit(f"{zip_path.name}: expected one file inside, found {len(members)}")

        # The file is latin-1 and the header is ASCII, so nothing is decoded on the way through
        # and no accent can be mangled.
        out_path = out_dir / f"{name}.csv"
        rows = 0

        # Written beside the real name, so a dump that dies halfway leaves a .part that
        # `make load` will not pick up and mistake for a complete table.
        with zf.open(members[0]) as src, out_path.with_suffix(".csv.part").open("wb") as dst:
            dst.write(";".join(header).encode() + b"\n")
            for fields, raw, line in records(src):
                rows += 1
                if len(fields) != len(header):
                    raise SystemExit(
                        f"{out_path.name} line {line}: {len(fields)} fields, header declares "
                        f"{len(header)} — the mapping is wrong"
                    )
                if line % 1_000_000 == 0:
                    print(f"    {line:,} lines…", flush=True)
                dst.write(raw)

        out_path.with_suffix(".csv.part").rename(out_path)

    return f"{out_path.name} — {rows} rows"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--in", dest="src", type=Path, default=HERE / "in", help="folder holding the zips")
    parser.add_argument("--out", dest="dst", type=Path, default=HERE / "out", help="folder for the csvs")
    args = parser.parse_args()

    zips = sorted(p for p in args.src.glob("*") if p.suffix.lower() == ".zip")
    if not zips:
        raise SystemExit(f"no .zip in {args.src}")

    args.dst.mkdir(parents=True, exist_ok=True)
    for zip_path in zips:
        print(annotate(zip_path, args.dst))


if __name__ == "__main__":
    main()
