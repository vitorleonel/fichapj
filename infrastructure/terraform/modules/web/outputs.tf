output "url" {
  value = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "bucket" {
  value = aws_s3_bucket.main.bucket
}

output "function_name" {
  value = aws_lambda_function.server.function_name
}
