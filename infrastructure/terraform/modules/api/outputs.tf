data "aws_region" "current" {}

output "api_id" {
  value = aws_api_gateway_rest_api.main.id
}

# The address the frontend calls. Assembled here so the region is written down once.
output "invoke_url" {
  value = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${data.aws_region.current.region}.amazonaws.com/${aws_api_gateway_stage.main.stage_name}"
}

output "token_secret_name" {
  value = aws_secretsmanager_secret.token.name
}
