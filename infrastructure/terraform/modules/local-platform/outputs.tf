output "network_name" {
  description = "Docker DNS/network boundary used by operational tools."
  value       = docker_network.platform.name
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
