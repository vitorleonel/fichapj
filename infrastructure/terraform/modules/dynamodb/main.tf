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
    "motivos" = "codigo",
  }

  # The sort key, for the table whose partition repeats: a company has several sócios, and the
  # import writes one item per row, so without this each partner overwrites the last. Written as
  # a column by scripts/local_add_headers.
  ranges = {
    "socios" = "socio",
  }
}

resource "aws_dynamodb_table" "main" {
  for_each = local.tables

  name         = "${var.name_prefix}-${each.key}-${var.name_suffix}"
  billing_mode = var.billing_mode
  hash_key     = each.value
  range_key    = lookup(local.ranges, each.key, null)

  # One declaration per key; a table without a sort key carries only the partition.
  dynamic "attribute" {
    for_each = compact([each.value, lookup(local.ranges, each.key, null)])

    content {
      name = attribute.value
      type = "S"
    }
  }

  lifecycle {
    prevent_destroy = var.prevent_destroy
  }
}
