variable "name_prefix" {
  description = "Table name prefix"
  type        = string
}

variable "name_suffix" {
  description = "Table name suffix"
  type        = string
  default     = ""
}

variable "prevent_destroy" {
  description = "Prevent destruction of the table"
  type        = bool
  default     = false
}

variable "billing_mode" {
  description = "PAY_PER_REQUEST or PROVISIONED"
  type        = string
  default     = "PAY_PER_REQUEST"
}
