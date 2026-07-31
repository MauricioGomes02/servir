output "topics" {
  description = "Kafka topics managed by this environment."
  value       = module.messaging.topics
}
