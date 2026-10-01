output "api_id" {
  value = module.api.api_id
}

# Goes in the Worker's API_URL, in the Cloudflare dashboard.
output "api_url" {
  value = module.api.api_url
}

# Both created by hand at Cloudflare, once.
output "acm_validation_records" {
  value = module.api.acm_validation_records
}

output "domain_cname_target" {
  value = module.api.domain_cname_target
}

output "token_secret_name" {
  value = module.api.token_secret_name
}
