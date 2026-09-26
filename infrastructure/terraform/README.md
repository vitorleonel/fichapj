# Infrastructure

OpenTofu code for the CNPJ project. `modules/dynamodb` describes the tables;
`envs/local` runs against floci, `envs/prod` against real AWS.

## Importing the tables

The tables are created by the DynamoDB S3 import, so OpenTofu starts with an empty state and
would try to create all nine again. The address is the module call plus the table's key in
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
```

Run from the env directory, after `tofu init`. Quotes matter — the shell eats the brackets.
Each env has its own state, so the imports repeat per env.

`tofu plan` must end in `No changes.` A `~ update in-place` is harmless to apply; `-/+ replace`
means the name or partition key disagrees with `locals.tables` — fix the map and re-import
instead of applying, or you recreate a table you just filled.

Import only writes to state. It never touches the table.
