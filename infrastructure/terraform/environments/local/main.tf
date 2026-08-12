module "platform" {
  source = "../../modules/local-platform"

  network_name   = var.network_name
  network_subnet = var.network_subnet

  postgres_image             = var.postgres_image
  postgres_port              = var.postgres_port
  postgres_database          = var.postgres_database
  postgres_migrator_user     = var.postgres_migrator_user
  postgres_migrator_password = var.postgres_migrator_password

  kafka_image              = var.kafka_image
  volume_initializer_image = var.volume_initializer_image
  kafka_external_port      = var.kafka_external_port
  kafka_cluster_id         = var.kafka_cluster_id

  otel_collector_image = var.otel_collector_image
  otel_http_port       = var.otel_http_port
  jaeger_image         = var.jaeger_image
  jaeger_ui_port       = var.jaeger_ui_port

  api_image                = var.api_image
  api_enabled              = var.api_enabled
  api_resources            = var.api_resources
  api_environment          = var.api_environment
  frontend_image           = var.frontend_image
  frontend_port            = var.frontend_port
  frontend_enabled         = var.frontend_enabled
  frontend_resources       = var.frontend_resources
  frontend_environment     = var.frontend_environment
  outbox_relay_image       = var.outbox_relay_image
  outbox_relay_enabled     = var.outbox_relay_enabled
  outbox_relay_resources   = var.outbox_relay_resources
  outbox_relay_environment = var.outbox_relay_environment
}
