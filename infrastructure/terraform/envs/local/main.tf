module "dynamodb" {
  source = "../../modules/dynamodb"

  name_prefix = "fichapj-cnpjs"
  name_suffix = "2026-09_1"
}

module "api" {
  source = "../../modules/api"

  name = "fichapj-cnpjs-api"

  source_dir  = "${path.root}/../../../../apps/api"
  table_names = module.dynamodb.names
  table_arns  = module.dynamodb.arns

  # The Lambda containers run outside floci's network, so they reach it through the host.
  lambda_environment = {
    AWS_ENDPOINT_URL      = "http://host.docker.internal:4566"
    AWS_ACCESS_KEY_ID     = "test"
    AWS_SECRET_ACCESS_KEY = "test"
    AWS_DEFAULT_REGION    = "us-east-1"
  }
}
