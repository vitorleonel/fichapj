locals {
  tables = {
    "empresas" = "cnpj_basico",
    "estabelecimentos" = "cnpj", // CNPJ Básico + CNPJ Ordem + CNPJ DV
    "dados_do_simples" = "cnpj_basico",
    "socios" = "cnpj_basico",
    "paises" = "codigo",
    "municipios" = "codigo",
    "qualificacoes_de_socios" = "codigo",
    "naturezas_juridicas" = "codigo",
    "cnaes" = "codigo",
  }
}

resource "aws_dynamodb_table" "main" {
  for_each = local.tables

  name         = "${var.name_prefix}-${each.key}-${var.name_suffix}"
  billing_mode = var.billing_mode
  hash_key     = each.value

  attribute {
    name = each.value
    type = "S"
  }

  lifecycle {
    prevent_destroy = var.prevent_destroy
  }
}
