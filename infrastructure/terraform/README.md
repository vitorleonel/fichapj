# Infrastructure

OpenTofu code for the CNPJ project. `modules/dynamodb` describes the tables, `modules/api` the
gateway, the token authorizer and the Lambdas, and `modules/web` the site itself; `envs/local`
runs against floci, `envs/prod` against real AWS.

## Importing the tables

The tables are created by the DynamoDB S3 import, so OpenTofu starts with an empty state and
would try to create all ten again. The address is the module call plus the table's key in
`modules/dynamodb/main.tf` → `locals.tables`; the ID is the table name.

```bash
tofu import 'module.dynamodb.aws_dynamodb_table.main["empresas"]' fichapj-cnpjs-empresas-2026-09_1
tofu import 'module.dynamodb.aws_dynamodb_table.main["estabelecimentos"]' fichapj-cnpjs-estabelecimentos-2026-09_1
tofu import 'module.dynamodb.aws_dynamodb_table.main["dados_do_simples"]' fichapj-cnpjs-dados_do_simples-2026-09_1
tofu import 'module.dynamodb.aws_dynamodb_table.main["socios"]' fichapj-cnpjs-socios-2026-09_1
tofu import 'module.dynamodb.aws_dynamodb_table.main["paises"]' fichapj-cnpjs-paises-2026-09_1
tofu import 'module.dynamodb.aws_dynamodb_table.main["municipios"]' fichapj-cnpjs-municipios-2026-09_1
tofu import 'module.dynamodb.aws_dynamodb_table.main["qualificacoes_de_socios"]' fichapj-cnpjs-qualificacoes_de_socios-2026-09_1
tofu import 'module.dynamodb.aws_dynamodb_table.main["naturezas_juridicas"]' fichapj-cnpjs-naturezas_juridicas-2026-09_1
tofu import 'module.dynamodb.aws_dynamodb_table.main["cnaes"]' fichapj-cnpjs-cnaes-2026-09_1
tofu import 'module.dynamodb.aws_dynamodb_table.main["motivos"]' fichapj-cnpjs-motivos-2026-09_1
```

Run from the env directory, after `tofu init`. Quotes matter — the shell eats the brackets.
Each env has its own state, so the imports repeat per env.

`tofu plan` must end in `No changes.` A `~ update in-place` is harmless to apply; `-/+ replace`
means the name or partition key disagrees with `locals.tables` — fix the map and re-import
instead of applying, or you recreate a table you just filled.

Import only writes to state. It never touches the table.

## Calling the API

The gateway expects the token in the `Authorization` header. Terraform creates only the secret
container, so the value never reaches the state file — put it in yourself, once per apply:

```bash
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_DEFAULT_REGION=us-east-1 \
  aws --endpoint-url http://localhost:4566 secretsmanager put-secret-value \
  --secret-id "$(tofu output -raw token_secret_name)" --secret-string local-dev-token
```

In floci the API answers on the edge path:

```bash
curl -H "Authorization: local-dev-token" \
  "http://localhost:4566/execute-api/$(tofu output -raw api_id)/v1/cnpj/19131243000197"
```

`GET /v1/cnpj/{cnpj}` returns `{"empresa": ..., "estabelecimento": ...}`, one lookup per table.

A field holding a code is swapped for `{codigo, descricao}` — a list of them when the dump packs
several into one field, as `cnae_fiscal_secundaria` does. `EMPRESA_CODES` and
`ESTABELECIMENTO_CODES` in `apps/api/handler.py` name which fields those are and where each
description lives; the rest come through untouched. A source is a DynamoDB table, or a plain
map for the two domains the Receita fixes in its layout instead of publishing as a file —
`PORTE` and `SITUACAO_CADASTRAL`, the latter covering the second `situacao_cadastral` code
alongside the `motivos` table's *reason*. A code the source does not know keeps its place with
a null `descricao`, so a gap in the reference data never drops something the company does have.
`DEFAULT_CODES` holds the code to read when a field is empty — `pais` is only filled for an
address abroad, so an empty one resolves to Brazil.

Errors are `{"message": ...}` — the same shape the gateway uses — with `400` for a malformed cnpj,
`403` for a bad or missing token, and `404` for an unknown cnpj — a row missing from either the
`empresas` or the `estabelecimentos` side counts as unknown. Any other path is refused by the
gateway itself, with its overridden `404 {"message": "not found"}`.

The `<api_id>.execute-api.localhost.floci.io` host form does not route in floci — it falls through
to S3 and answers `NoSuchBucket`.

The three functions share the `apps/api` directory — edit it and `tofu apply` re-packages and
updates them. `apps/api/test_handler.py` checks the code resolution against a stub table, no AWS
involved: `uv run apps/api/test_handler.py`.

## Deploying the site

`modules/web` hosts `apps/frontend`. OpenNext turns the Next.js build into a Lambda, and
CloudFront puts S3 in front of the static assets and a function URL in front of everything else.
The site calls the API through the gateway, so `envs/prod` applies both modules together.

Order matters — Terraform only zips what the build already wrote:

```bash
cd apps/frontend && npm run build:opennext

cd infrastructure/terraform/envs/prod
tofu init && tofu apply
tofu output -raw site_url
```

Re-run the build before every apply that follows a frontend change; `source_code_hash` sees the
zip, not the source behind it. `tofu init -backend=false && tofu validate` checks the HCL without
credentials or a state bucket, which is the cheapest way to catch a typo here.

The site's Lambda reads the token from Secrets Manager at request time, the same way the
authorizer does, so only the secret's ARN travels through Terraform and the value still never
reaches the state file. Populating it is the plain command — no `--endpoint-url`, real
credentials:

```bash
aws secretsmanager put-secret-value \
  --secret-id "$(tofu output -raw token_secret_name)" --secret-string '<the token>'
```

`envs/prod` creates the ten tables but does not fill them. An empty base is a successful deploy
that 404s every lookup — read the warning at the top of `scripts/README.md` before importing
anything.

Two things inherited from the floci setup to watch on the first real `tofu init`: the state
backend sets `use_path_style = true`, and the tables carry `prevent_destroy = true`. The first is
usually harmless against real S3 but nobody would write it by hand; the second means a mistake in
the table map fails the apply instead of dropping the data.

For local development the frontend now reads the token from floci's Secrets Manager, so
`apps/frontend/.env.local` carries `TOKEN_SECRET_ARN` plus `AWS_ENDPOINT_URL` and fake
credentials — see the comments in that file. It is a name where prod passes an ARN;
`get_secret_value` takes either.
