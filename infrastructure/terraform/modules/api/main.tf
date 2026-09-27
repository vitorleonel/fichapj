locals {
  # The authorizer is a function of its own so the gateway turns the request away
  # before the API functions run. One function per route, each writing down only the
  # permissions its own route needs: the one that reads a single row never holds a
  # scan, and the one that scans can never read the token.
  functions = {
    authorizer = {
      handler = "authorizer.handler"
      env     = { TOKEN_SECRET_ARN = aws_secretsmanager_secret.token.arn }
      policy = [{
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = [aws_secretsmanager_secret.token.arn]
      }]
    }
    handler = {
      handler = "handler.handler"
      # The whole map, so a new table in the handler needs no change here.
      env = { TABLES = jsonencode(var.table_names) }
      policy = [{
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:BatchGetItem"]
        Resource = values(var.table_arns)
      }]
    }
    stats = {
      handler = "stats.handler"
      env     = { TABLES = jsonencode(var.table_names) }
      policy = [{
        Effect   = "Allow"
        Action   = ["dynamodb:Scan"]
        Resource = values(var.table_arns)
      }]
    }
  }
}

# Only the container. The value goes in through the CLI, so it never reaches the
# state file — Terraform stores every argument of every resource it manages.
resource "aws_secretsmanager_secret" "token" {
  name = "${var.name}-token"

  # 0 deletes it on destroy instead of reserving the name for 30 days.
  recovery_window_in_days = 0
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

  # The default 3s is below what a cold authorizer needs for its secret read.
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

# A TOKEN authorizer reads the Authorization header, so there is no identity source to set.
resource "aws_api_gateway_authorizer" "token" {
  name           = "${var.name}-token"
  rest_api_id    = aws_api_gateway_rest_api.main.id
  type           = "TOKEN"
  authorizer_uri = aws_lambda_function.main["authorizer"].invoke_arn

  # No caching, so a rotated token takes effect on the next request.
  authorizer_result_ttl_in_seconds = 0
}

resource "aws_api_gateway_method" "cnpj" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.cnpj_id.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.token.id
}

resource "aws_api_gateway_integration" "cnpj" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.cnpj_id.id
  http_method             = aws_api_gateway_method.cnpj.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.main["handler"].invoke_arn
}

resource "aws_lambda_permission" "authorizer" {
  statement_id  = "apigateway-authorizer"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.main["authorizer"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/authorizers/${aws_api_gateway_authorizer.token.id}"
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

resource "aws_api_gateway_resource" "stats" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "stats"
}

resource "aws_api_gateway_method" "stats" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.stats.id
  http_method   = "GET"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.token.id
}

resource "aws_api_gateway_integration" "stats" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.stats.id
  http_method             = aws_api_gateway_method.stats.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.main["stats"].invoke_arn
}

resource "aws_lambda_permission" "stats" {
  statement_id  = "apigateway-stats"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.main["stats"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/GET/stats"
}

# API Gateway only redeploys when this changes, never on its own.
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.cnpj_id.id,
      aws_api_gateway_method.cnpj.id,
      aws_api_gateway_integration.cnpj.id,
      aws_api_gateway_authorizer.token.id,
      aws_api_gateway_gateway_response.not_found.id,
      aws_api_gateway_resource.stats.id,
      aws_api_gateway_method.stats.id,
      aws_api_gateway_integration.stats.id,
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
