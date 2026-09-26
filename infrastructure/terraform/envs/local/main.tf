module "dynamodb" {
  source = "../../modules/dynamodb"

  name_prefix = "fichapj-cnpjs"
  name_suffix = "2026-09_1"
}
