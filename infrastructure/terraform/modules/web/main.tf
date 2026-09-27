data "aws_caller_identity" "current" {}

# The OpenNext bundle: a Lambda that serves the whole Next.js app, plus the static
# assets it wrote at build time. Next has no server of its own on AWS, so this module
# is what turns `.open-next/` into something reachable.

locals {
  # The function URL attribute carries the scheme and a trailing slash; a CloudFront
  # origin domain takes neither. Either scheme, because floci hands back http://.
  function_domain = trimsuffix(
    replace(aws_lambda_function_url.server.function_url, "/^https?:\\/\\//", ""),
    "/",
  )

  # AWS's own AllViewerExceptHostHeader, which is built for exactly this origin: it
  # drops the viewer's Host so the function sees its own domain, and forwards
  # everything else — cookies, query strings, and the rsc header client navigation
  # needs. Written out rather than named because the module cannot reference it.
  all_viewer_except_host = "b689b0a8-53d0-40ab-baf2-68738e2966ac"

  # Only the extensions this build actually emits. Anything else falls back below.
  content_types = {
    css   = "text/css"
    js    = "text/javascript"
    woff2 = "font/woff2"
  }

  assets = fileset("${var.source_dir}/assets", "**")
}

# One bucket for two jobs: the static assets, and the incremental cache that backs
# `fetch(..., { next: { revalidate } })`. Without the second one every request would be
# a cache miss, and the /stats scan would run on each page view.
resource "aws_s3_bucket" "main" {
  bucket = "${var.name}-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_object" "asset" {
  for_each = local.assets

  bucket   = aws_s3_bucket.main.id
  key      = "_assets/${each.value}"
  source   = "${var.source_dir}/assets/${each.value}"
  etag     = filemd5("${var.source_dir}/assets/${each.value}")

  # Without this S3 hands CSS and JS back as octet-stream and the browser refuses them.
  content_type = lookup(
    local.content_types,
    regex("[^.]+$", each.value),
    "application/octet-stream",
  )
}

resource "aws_iam_role" "lambda" {
  name = "${var.name}-lambda"

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
  name = "${var.name}-lambda"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = ["*"]
      },
      {
        # The cache, read and written at request time.
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = ["${aws_s3_bucket.main.arn}/*"]
      },
      {
        # The same secret the authorizer reads, so rotating it is one command.
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = [var.token_secret_arn]
      },
    ]
  })
}

data "archive_file" "server" {
  type        = "zip"
  source_dir  = "${var.source_dir}/server-functions/default"
  output_path = "${path.root}/build/${var.name}-server.zip"
}

resource "aws_lambda_function" "server" {
  function_name = "${var.name}-server"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs24.x"

  # The bundle is plain JavaScript, so the cheaper architecture costs nothing.
  architectures    = ["arm64"]
  filename         = data.archive_file.server.output_path
  source_code_hash = data.archive_file.server.output_base64sha256

  # The default 3s is far below a cold Next.js start.
  timeout     = 30
  memory_size = 1024

  environment {
    variables = {
      CACHE_BUCKET_NAME = aws_s3_bucket.main.bucket
      API_URL           = var.api_url
      TOKEN_SECRET_ARN  = var.token_secret_arn
    }
  }
}

resource "aws_lambda_function_url" "server" {
  function_name      = aws_lambda_function.server.function_name
  authorization_type = "AWS_IAM"

  # Without this the whole page waits for the slowest fetch, and the counter in the
  # navbar stops streaming in.
  invoke_mode = "RESPONSE_STREAM"
}

resource "aws_lambda_permission" "cloudfront_url" {
  statement_id  = "cloudfront-url"
  action        = "lambda:InvokeFunctionUrl"
  function_name = aws_lambda_function.server.function_name
  principal     = "cloudfront.amazonaws.com"
  source_arn    = aws_cloudfront_distribution.main.arn

  function_url_auth_type = "AWS_IAM"
}

# Since October 2025 a function URL needs this second permission as well; with only
# the one above, CloudFront gets a 403 from the function URL.
resource "aws_lambda_permission" "cloudfront_invoke" {
  statement_id  = "cloudfront-invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.server.function_name
  principal     = "cloudfront.amazonaws.com"
  source_arn    = aws_cloudfront_distribution.main.arn
}

resource "aws_cloudfront_origin_access_control" "lambda" {
  name                              = "${var.name}-lambda"
  origin_access_control_origin_type = "lambda"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_origin_access_control" "s3" {
  name                              = "${var.name}-s3"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Everything the default behavior serves is rendered per request.
resource "aws_cloudfront_cache_policy" "dynamic" {
  name        = "${var.name}-dynamic"
  min_ttl     = 0
  default_ttl = 0
  max_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

# The build hashes every filename under _next/static, so those can sit at the edge.
resource "aws_cloudfront_cache_policy" "assets" {
  name        = "${var.name}-assets"
  min_ttl     = 0
  default_ttl = 86400
  max_ttl     = 31536000

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true

    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

resource "aws_cloudfront_distribution" "main" {
  enabled = true

  origin {
    domain_name              = local.function_domain
    origin_id                = "lambda"
    origin_access_control_id = aws_cloudfront_origin_access_control.lambda.id

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  origin {
    domain_name              = aws_s3_bucket.main.bucket_regional_domain_name
    origin_id                = "s3"
    origin_path              = "/_assets"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  default_cache_behavior {
    target_origin_id       = "lambda"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]

    # No compression here on purpose: this is the behavior the streamed response comes
    # through, and the counter in the navbar is the whole reason it streams.
    cache_policy_id          = aws_cloudfront_cache_policy.dynamic.id
    origin_request_policy_id = local.all_viewer_except_host
  }

  # The two paths the build writes to disk instead of rendering. Static only, so the
  # Pages Router's _next/data/* — which is rendered, not a file — falls through to
  # the default behavior above.
  ordered_cache_behavior {
    path_pattern           = "/_next/static/*"
    target_origin_id       = "s3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id = aws_cloudfront_cache_policy.assets.id
  }

  ordered_cache_behavior {
    path_pattern           = "/BUILD_ID"
    target_origin_id       = "s3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id = aws_cloudfront_cache_policy.assets.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

data "aws_iam_policy_document" "assets" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.main.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.main.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "assets" {
  bucket = aws_s3_bucket.main.id
  policy = data.aws_iam_policy_document.assets.json
}
