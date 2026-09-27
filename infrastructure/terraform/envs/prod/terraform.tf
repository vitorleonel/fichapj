terraform {
  required_version = ">= 1.6"

  required_providers {
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.4"
    }

    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.0"
    }
  }

  backend "s3" {
    bucket = "fichapj-tfstate"
    key    = "envs/prod/terraform.tfstate"
    region = "sa-east-1"

    use_lockfile   = true
    use_path_style = true
  }
}
