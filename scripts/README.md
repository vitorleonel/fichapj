# Scripts

Local tooling for getting the Receita Federal CNPJ dumps into a shape the infrastructure can
consume. Nothing here runs in AWS.

Both run through `uv`, which reads the PEP 723 header each script carries and picks the
interpreter from it — the `python3` on macOS is Apple's 3.9 and deprecated. `local_load_dynamodb`
also declares boto3 there, so it needs no virtualenv.

## local_add_headers

The Receita publishes its tables as `;`-separated files with **no header row** — position is the
only thing that says which column is which. This script unzips each dump, prepends the header and
writes `<ZipName>.csv`.

```bash
make headers                                    # scripts/local_add_headers/in and out/
make headers SRC=~/Downloads/dados DST=/tmp/out # somewhere else
```

Drop the zips in `scripts/local_add_headers/in/` (gitignored, as is `out/`). A zip with no entry in
`handlers.py` is skipped with a message, not an error.

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

The dump is copied byte for byte (it is latin-1, the header is ASCII), so no accent is touched.
Values arrive quoted — `"0111301";"Cultivo de arroz"` — and descriptions do contain `;`, so read
the output with a CSV parser rather than splitting on the separator.

## local_load_dynamodb

Reads the csvs `local_add_headers` wrote and puts them in the local DynamoDB, one table per file:

```bash
make load                     # scripts/local_add_headers/out
make load CSV=~/dados/csv     # somewhere else
```

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
