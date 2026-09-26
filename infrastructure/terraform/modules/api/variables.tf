variable "name" {
  description = "Name for the API, the functions, the role and the secret"
  type        = string
}

variable "source_dir" {
  description = "Directory holding the Lambda sources, packaged as a single zip"
  type        = string
}

variable "table_names" {
  description = "Table key to name, as output by the dynamodb module"
  type        = map(string)
}

variable "table_arns" {
  description = "Table key to ARN, as output by the dynamodb module"
  type        = map(string)
}

variable "lambda_environment" {
  description = "Extra environment variables for the functions, e.g. the emulator endpoint"
  type        = map(string)
  default     = {}
}
