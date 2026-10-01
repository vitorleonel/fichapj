output "api_id" {
  value = aws_api_gateway_rest_api.main.id
}

output "api_url" {
  value = var.domain_name == null ? null : "https://${var.domain_name}"
}

# Create by hand; ACM only hands these out while the certificate is pending.
output "acm_validation_records" {
  value = var.domain_name == null ? [] : [
    for option in aws_acm_certificate.api[0].domain_validation_options : {
      name  = option.resource_record_name
      type  = option.resource_record_type
      value = option.resource_record_value
    }
  ]
}

# Where the api CNAME points.
output "domain_cname_target" {
  value = var.domain_name == null ? null : aws_api_gateway_domain_name.api[0].regional_domain_name
}

output "token_secret_name" {
  value = aws_secretsmanager_secret.token.name
}
