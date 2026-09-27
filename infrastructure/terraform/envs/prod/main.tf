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

module "web" {
  source = "../../modules/web"

  name = "fichapj-cnpjs-web"

  # Terraform zips what the OpenNext build already wrote, so run
  # `npm run build:opennext` in apps/frontend before the apply.
  source_dir = "${path.root}/../../../../apps/frontend/.open-next"

  api_url          = module.api.invoke_url
  token_secret_arn = module.api.token_secret_arn
}
