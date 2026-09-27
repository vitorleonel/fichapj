variable "name" {
  type = string
}

# The `.open-next` directory `npm run build:opennext` writes. Terraform zips it, so the
# build has to run before the apply.
variable "source_dir" {
  type = string
}

# Where the API Gateway stage answers. Comes from the api module's invoke_url.
variable "api_url" {
  type = string
}

# Only the ARN travels through Terraform. The value goes in through the CLI, so it
# never reaches the state file.
variable "token_secret_arn" {
  type = string
}
