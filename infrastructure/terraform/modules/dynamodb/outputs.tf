output "names" {
  value = { for key, table in aws_dynamodb_table.main : key => table.name }
}

output "arns" {
  value = { for key, table in aws_dynamodb_table.main : key => table.arn }
}
