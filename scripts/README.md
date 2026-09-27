# Scripts

Local tooling for getting the Receita Federal CNPJ dumps into a shape the infrastructure can
consume. Nothing here runs in AWS.

Both run through `uv`, which reads the PEP 723 header each script carries and picks the
interpreter from it — the `python3` on macOS is Apple's 3.9 and deprecated. `local_load_dynamodb`
also declares boto3 there, so it needs no virtualenv.

## local_add_headers

The Receita publishes its tables as `;`-separated files with **no header row** — position is the
only thing that says which column is which. This script unzips each dump, prepends the header and
writes `<ZipName>.csv`, transcoded from the dump's latin-1 to UTF-8.

```bash
make headers                                    # every zip in scripts/local_add_headers/in
make headers ONLY=Estabelecimentos              # just that one, or a single part: Socios3
make headers GZIP=1                             # <ZipName>.csv.gz, the shape the S3 import takes
make headers SRC=~/Downloads/dados DST=/tmp/out # somewhere else
```

`out/` holds one encoding, so re-run `make headers` after pulling this change — csvs written
before it are latin-1 and `make load` will read their accents as mojibake.

Drop the zips in `scripts/local_add_headers/in/` (gitignored, as is `out/`). A zip with no entry in
`handlers.py` is skipped with a message, not an error.

`ONLY` is a name prefix, so `Estabelecimentos` takes all ten of its parts while `Socios3` takes
one — that is how you watch a single dump while a new mapping is still wrong. Each output is
written as `<name>.csv.part` and renamed only at the end, so a run that dies halfway cannot leave
a truncated csv behind for `make load` to eat.

### Where the dumps come from

One folder per month under <https://arquivos.receitafederal.gov.br/index.php/s/YggdBLfdninEJX9>
(add `?path=%2F2026-09` to land on a month). The same files are catalogued on
[dados.gov.br](https://dados.gov.br/dados/conjuntos-dados/cadastro-nacional-da-pessoa-juridica---cnpj).
The `/dados/cnpj/dados_abertos_cnpj/` path that older guides give now answers 404.

`Empresas`, `Socios` and `Estabelecimentos` come in ten numbered parts (`Empresas0.zip` …
`Empresas9.zip`) sharing one layout; the rest are single files.

### Adding a file

One line per dump in `handlers.py`, columns in file order:

```python
HEADERS = {
    "Cnaes": ["codigo", "descricao"],
}
```

The key is the zip name without the extension. Digits are stripped on lookup, so a single
`Empresas` entry covers all ten parts. Name the first column after the table's partition key in
`infrastructure/terraform/modules/dynamodb/main.tf` — those names become the DynamoDB attributes.

Every line is checked against the header's column count and the run stops at the first mismatch, so
a wrong mapping fails loudly instead of writing a mislabelled file.

Accents are the one thing the script does change. The dump is latin-1, DynamoDB's import only
reads UTF-8, so every record is transcoded on the way out — quoting, separators and newlines are
passed through untouched. Values arrive quoted — `"0111301";"Cultivo de arroz"` — and descriptions
do contain `;`, so read the output with a CSV parser rather than splitting on the separator.

### Importing into AWS

The import creates a **new** table; it cannot write into an existing one, which is where the
`-2026-09_1` suffix on the tables in `modules/dynamodb` comes from.

Two settings have to match our files, and neither is the default:

- `--input-format-options 'Csv={Delimiter=;}'` — the import assumes commas.
- **Do not pass `HeaderList`.** Our files carry their own header row, which the import reads as
  the header. Supplying one on the command line makes it read that row as an item instead.

GZIP and ZSTD are both accepted; uncompressed works too, it is just a far bigger upload.

## local_load_dynamodb

Reads the csvs `local_add_headers` wrote and puts them in the local DynamoDB, one table per file:

```bash
make load                     # scripts/local_add_headers/out
make load PREFIX=1913         # only companies whose cnpj_basico starts with 1913
make load CSV=~/dados/csv     # somewhere else
```

**Load a prefix, not the whole base.** Floci keeps every item in memory in all four of its
storage modes — `persistent` only changes *when* it writes to disk, reads still come from the
heap — and the full base is tens of millions of rows. It does not fit, and the container is
`OOMKilled` partway through. The default Colima VM is 2 GiB and took about 166k rows before
dying; budget roughly 9 KB of heap per row.

Every big dump carries `cnpj_basico`, so one prefix cuts the *same* companies out of Empresas,
Estabelecimentos, Socios and Simples, and a lookup returns a company with its establishments. The
lookup tables (Cnaes, Motivos, …) have no `cnpj_basico` and always load whole. A four-digit prefix
is around 1/10000 of the base — a few thousand rows, comfortable in 2 GiB.

The cost is that every row is still read to be filtered, so a prefixed run decompresses the whole
set. It reports rows read next to rows kept.

The file name picks the table, through the `TABLES` map in `main.py`; a csv with no entry is
skipped with a message. The real table name carries the `name_prefix`/`name_suffix` from
`envs/local/main.tf`, so it is looked up with `list_tables` and matched on `-<key>-` instead of
being hardcoded. Digits are stripped, so `Empresas0.csv` … `Empresas9.csv` all land in `empresas`.

Writes go through `batch_writer`, which chunks 25 at a time and retries what DynamoDB could not
take, and progress prints every 100k rows. Every value goes in as a string — the csv ones already
are, `capital_social` included, which DynamoDB would reject as a number anyway.

Two things still open:

- `socios` is partitioned only on `cnpj_basico`, so a company with several partners keeps whichever
  row is written last. The table needs a sort key; which one depends on what makes a sócio unique,
  and that is worth reading off the real data first.
- `estabelecimentos` is keyed by the full 14-digit `cnpj`, which the dump splits into
  `cnpj_basico`/`cnpj_ordem`/`cnpj_dv`. The script joins the three into `cnpj` — the only
  transformation it does.
