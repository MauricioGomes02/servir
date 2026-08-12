output "network_name" {
  description = "Data network consumed by operational tools such as Liquibase."
  value       = docker_network.platform["data"].name
}

output "network_names" {
  description = "Docker network boundaries keyed by their communication role."
  value       = { for role, network in docker_network.platform : role => network.name }
}

output "postgres_host_endpoint" {
  description = "PostgreSQL endpoint for applications running on the host."
  value       = "localhost:${var.postgres_port}"
}

output "postgres_container_endpoint" {
  description = "PostgreSQL endpoint for containers attached to the platform network."
  value       = "postgres:5432"
}

output "kafka_host_endpoint" {
  description = "Kafka bootstrap endpoint for applications running on the host."
  value       = "localhost:${var.kafka_external_port}"
}

output "kafka_container_endpoint" {
  description = "Kafka bootstrap endpoint for containers attached to the platform network."
  value       = "kafka:9092"
}

output "otel_http_host_endpoint" {
  description = "OTLP/HTTP traces endpoint for applications running on the host."
  value       = "http://localhost:${var.otel_http_port}/v1/traces"
}

output "otel_http_container_endpoint" {
  description = "OTLP/HTTP traces endpoint for containers attached to the platform network."
  value       = "http://otel-collector:4318/v1/traces"
}

output "jaeger_ui_url" {
  description = "Jaeger trace exploration UI available on the host."
  value       = "http://localhost:${var.jaeger_ui_port}"
}

output "frontend_url" {
  description = "Frontend BFF URL available on the host loopback interface."
  value       = "http://localhost:${var.frontend_port}"
}
