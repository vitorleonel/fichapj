# /// script
# requires-python = ">=3.9"
# ///
"""Writes the header row the Receita Federal CNPJ zips are missing."""

import argparse
import csv
import gzip
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
    record be re-encoded whole, without a csv writer touching the quoting.
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


def annotate(zip_path, out_dir, gz=False):
    name = zip_path.stem
    header = header_for(name)
    if header is None:
        return f"skipped {zip_path.name} — no header defined"

    with zipfile.ZipFile(zip_path) as zf:
        members = [m for m in zf.namelist() if not m.endswith("/")]
        if len(members) != 1:
            raise SystemExit(f"{zip_path.name}: expected one file inside, found {len(members)}")

        out_path = out_dir / f"{name}.csv{'.gz' if gz else ''}"
        part_path = out_path.with_name(out_path.name + ".part")
        rows = 0

        # Written beside the real name, so a dump that dies halfway leaves a .part that
        # `make load` will not pick up and mistake for a complete table.
        with zf.open(members[0]) as src, (gzip.open if gz else open)(part_path, "wb") as dst:
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
                # The dump is latin-1 and the S3 import only reads UTF-8, so every record is
                # transcoded on the way out. Doubling as the reader for `records` is the only
                # other place the source encoding appears.
                dst.write(raw.decode("latin-1").encode("utf-8"))

        part_path.rename(out_path)

    return f"{out_path.name} — {rows} rows"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("only", nargs="?", help="run only the zips whose name starts with this")
    parser.add_argument("--in", dest="src", type=Path, default=HERE / "in", help="folder holding the zips")
    parser.add_argument("--out", dest="dst", type=Path, default=HERE / "out", help="folder for the csvs")
    parser.add_argument(
        "--gzip",
        action="store_true",
        help="write <name>.csv.gz instead of <name>.csv, the shape the S3 import wants",
    )
    args = parser.parse_args()

    # A prefix, so `Estabelecimentos` takes all ten of its parts and `Socios3` takes one.
    zips = [p for p in sorted(args.src.glob("*")) if p.suffix.lower() == ".zip"]
    if args.only:
        zips = [p for p in zips if p.stem.lower().startswith(args.only.lower())]
    if not zips:
        raise SystemExit(f"no .zip in {args.src}" + (f" starting with {args.only}" if args.only else ""))

    args.dst.mkdir(parents=True, exist_ok=True)
    for zip_path in zips:
        print(annotate(zip_path, args.dst, args.gzip))


if __name__ == "__main__":
    main()
