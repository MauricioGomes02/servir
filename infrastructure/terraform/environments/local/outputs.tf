output "network_name" {
  description = "Docker data network consumed by operational Compose jobs."
  value       = module.platform.network_name
}

output "network_names" {
  description = "Docker network boundaries keyed by their communication role."
  value       = module.platform.network_names
}

output "postgres_host_endpoint" {
  description = "PostgreSQL endpoint for API and relay processes on the host."
  value       = module.platform.postgres_host_endpoint
}

output "postgres_container_endpoint" {
  description = "PostgreSQL endpoint for containers on the platform network."
  value       = module.platform.postgres_container_endpoint
}

output "kafka_host_endpoint" {
  description = "Kafka bootstrap endpoint for relay processes on the host."
  value       = module.platform.kafka_host_endpoint
}

output "kafka_container_endpoint" {
  description = "Kafka bootstrap endpoint for containers on the platform network."
  value       = module.platform.kafka_container_endpoint
}

output "otel_http_host_endpoint" {
  description = "OTLP/HTTP traces endpoint for API and relay processes on the host."
  value       = module.platform.otel_http_host_endpoint
}

output "otel_http_container_endpoint" {
  description = "OTLP/HTTP traces endpoint for containers on the platform network."
  value       = module.platform.otel_http_container_endpoint
}

output "jaeger_ui_url" {
  description = "Jaeger trace exploration UI available on the host."
  value       = module.platform.jaeger_ui_url
}

output "api_url" {
  description = "Containerized API base URL available on the host."
  value       = module.platform.api_url
}
