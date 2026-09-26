terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.0"
    }
  }

  # State lives in floci, in the same place as the resources it tracks. Backend
  # blocks cannot read variables, so the values are literal by design.
  backend "s3" {
    bucket = "tfstate"
    key    = "envs/local/terraform.tfstate"
    region = "us-east-1"

    access_key = "test"
    secret_key = "test"

    use_path_style              = true
    skip_s3_checksum            = true
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true

    endpoints = {
      s3 = "http://localhost:4566"
    }
  }
}
