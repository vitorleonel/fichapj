output "api_id" {
  value = aws_api_gateway_rest_api.main.id
}

output "token_secret_name" {
  value = aws_secretsmanager_secret.token.name
}
