locals {
  functions = {
    handler = {
      handler = "handler.handler"
      # The whole map, so a new table in the handler needs no change here.
      env = { TABLES = jsonencode(var.table_names) }
      policy = [{
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:BatchGetItem", "dynamodb:Query"]
        Resource = values(var.table_arns)
      }]
    }
  }

  domain_count = var.domain_name == null ? 0 : 1
}

# One package holds every function, so they always run the same commit.
data "archive_file" "lambda" {
  type        = "zip"
  source_dir  = var.source_dir
  output_path = "${path.root}/build/${var.name}.zip"

  excludes = ["test_*.py", "__pycache__", "*.pyc"]
}

resource "aws_iam_role" "lambda" {
  for_each = local.functions

  name = "${var.name}-${each.key}-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "lambda" {
  for_each = local.functions

  name = "${var.name}-${each.key}-lambda"
  role = aws_iam_role.lambda[each.key].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [{
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = ["*"]
      }],
      each.value.policy,
    )
  })
}

resource "aws_lambda_function" "main" {
  for_each = local.functions

  function_name    = "${var.name}-${each.key}"
  handler          = each.value.handler
  role             = aws_iam_role.lambda[each.key].arn
  runtime          = "python3.14"
  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256

  # The default 3s is below a cold start plus the table reads.
  timeout = 10

  environment {
    variables = merge(var.lambda_environment, each.value.env)
  }
}

resource "aws_api_gateway_rest_api" "main" {
  name = var.name
}

resource "aws_api_gateway_resource" "cnpj" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "cnpj"
}

resource "aws_api_gateway_resource" "cnpj_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.cnpj.id
  path_part   = "{cnpj}"
}

resource "aws_api_gateway_method" "cnpj" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.cnpj_id.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "cnpj" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.cnpj_id.id
  http_method             = aws_api_gateway_method.cnpj.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.main["handler"].invoke_arn
}

# One budget for the whole route — the site shares it with everyone else.
resource "aws_api_gateway_method_settings" "cnpj" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "cnpj/{cnpj}/GET"

  settings {
    throttling_rate_limit  = 10
    throttling_burst_limit = 20
  }
}

resource "aws_lambda_permission" "handler" {
  statement_id  = "apigateway-handler"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.main["handler"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/GET/cnpj/*"
}

# AWS defaults an unmatched route to 403 "Missing Authentication Token" and
# documents overriding it to 404, which is what a missing path actually means.
resource "aws_api_gateway_gateway_response" "not_found" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "MISSING_AUTHENTICATION_TOKEN"
  status_code   = "404"

  response_templates = {
    "application/json" = jsonencode({ message = "not found" })
  }
}

# API Gateway only redeploys when this changes, never on its own.
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.cnpj_id.id,
      aws_api_gateway_method.cnpj.id,
      aws_api_gateway_integration.cnpj.id,
      aws_api_gateway_gateway_response.not_found.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "main" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  deployment_id = aws_api_gateway_deployment.main.id
  stage_name    = "v1"
}

# The execute-api certificate covers only *.execute-api.<region>.amazonaws.com.
resource "aws_acm_certificate" "api" {
  count = local.domain_count

  domain_name       = var.domain_name
  validation_method = "DNS"
}

# Waits for the CNAME created by hand at the DNS provider.
resource "aws_acm_certificate_validation" "api" {
  count = local.domain_count

  certificate_arn = aws_acm_certificate.api[0].arn
}

# The name the CNAME points at — not the invoke URL.
resource "aws_api_gateway_domain_name" "api" {
  count = local.domain_count

  domain_name              = var.domain_name
  regional_certificate_arn = aws_acm_certificate_validation.api[0].certificate_arn

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# Without it the domain answers 403.
resource "aws_api_gateway_base_path_mapping" "api" {
  count = local.domain_count

  api_id      = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  domain_name = aws_api_gateway_domain_name.api[0].domain_name
}
