module "dynamodb" {
  source = "../../modules/dynamodb"

  name_prefix = "fichapj-cnpjs"
  name_suffix = "2026-09_1"

  prevent_destroy = true
}

module "api" {
  source = "../../modules/api"

  name = "fichapj-cnpjs-api"

  source_dir  = "${path.root}/../../../../apps/api"
  table_names = module.dynamodb.names
  table_arns  = module.dynamodb.arns
}
