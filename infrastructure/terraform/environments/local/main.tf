module "platform" {
  source = "../../modules/local-platform"

  network_name    = var.network_name
  network_subnet  = var.network_subnet
  network_gateway = var.network_gateway

  postgres_image             = var.postgres_image
  postgres_port              = var.postgres_port
  postgres_database          = var.postgres_database
  postgres_migrator_user     = var.postgres_migrator_user
  postgres_migrator_password = var.postgres_migrator_password

  kafka_image              = var.kafka_image
  volume_initializer_image = var.volume_initializer_image
  kafka_external_port      = var.kafka_external_port
  kafka_cluster_id         = var.kafka_cluster_id
}
