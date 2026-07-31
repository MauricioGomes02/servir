provider "kafka" {
  bootstrap_servers = var.kafka_bootstrap_servers
  tls_enabled       = false
}
