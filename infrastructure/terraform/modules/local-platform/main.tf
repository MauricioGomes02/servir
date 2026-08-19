locals {
  network_segments = {
    edge          = 0
    application   = 1
    data          = 2
    messaging     = 3
    observability = 4
  }

}

resource "docker_network" "platform" {
  for_each = local.network_segments

  name       = "${var.network_name}-${each.key}"
  driver     = "bridge"
  attachable = true

  ipam_config {
    subnet  = cidrsubnet(var.network_subnet, 3, each.value)
    gateway = cidrhost(cidrsubnet(var.network_subnet, 3, each.value), 1)
  }

  labels {
    label = "servir.environment"
    value = "local"
  }

  labels {
    label = "servir.owner"
    value = "terraform"
  }
}

resource "docker_volume" "postgres_data" {
  name = "servir-postgres-data"

  labels {
    label = "servir.environment"
    value = "local"
  }

  labels {
    label = "servir.owner"
    value = "terraform"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "docker_volume" "kafka_data" {
  name = "servir-kafka-data"

  labels {
    label = "servir.environment"
    value = "local"
  }

  labels {
    label = "servir.owner"
    value = "terraform"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "docker_image" "postgres" {
  name         = var.postgres_image
  keep_locally = true
}

resource "docker_image" "kafka" {
  name         = var.kafka_image
  keep_locally = true
}

resource "docker_image" "volume_initializer" {
  name         = var.volume_initializer_image
  keep_locally = true
}

resource "docker_image" "otel_collector" {
  name         = var.otel_collector_image
  keep_locally = true
}

resource "docker_image" "jaeger" {
  name         = var.jaeger_image
  keep_locally = true
}

resource "docker_image" "grafana" {
  name         = var.grafana_image
  keep_locally = true
}

resource "docker_container" "postgres" {
  name           = "servir-postgres"
  hostname       = "postgres"
  image          = docker_image.postgres.image_id
  restart        = "unless-stopped"
  wait           = true
  wait_timeout   = 120
  remove_volumes = false

  env = [
    "POSTGRES_DB=${var.postgres_database}",
    "POSTGRES_USER=${var.postgres_migrator_user}",
    "POSTGRES_PASSWORD=${var.postgres_migrator_password}",
  ]

  networks_advanced {
    name    = docker_network.platform["data"].name
    aliases = ["postgres"]
  }

  ports {
    internal = 5432
    external = var.postgres_port
    ip       = "127.0.0.1"
  }

  volumes {
    volume_name    = docker_volume.postgres_data.name
    container_path = "/var/lib/postgresql/18/docker"
  }

  healthcheck {
    test     = ["CMD-SHELL", "pg_isready -U ${var.postgres_migrator_user} -d ${var.postgres_database}"]
    interval = "5s"
    timeout  = "5s"
    retries  = 10
  }

  labels {
    label = "servir.environment"
    value = "local"
  }

  labels {
    label = "servir.owner"
    value = "terraform"
  }
}

resource "terraform_data" "kafka_data_permissions" {
  triggers_replace = [
    docker_volume.kafka_data.id,
    docker_image.volume_initializer.image_id,
    "permissions-v1",
  ]

  provisioner "local-exec" {
    interpreter = ["/bin/sh", "-c"]
    command     = <<-EOT
      docker run --rm \
        --network none \
        --read-only \
        --cap-drop ALL \
        --cap-add CHOWN \
        --user 0:0 \
        --label servir.environment=local \
        --label servir.owner=terraform \
        --label servir.role=volume-initializer \
        --mount type=volume,source=${docker_volume.kafka_data.name},target=/data \
        ${docker_image.volume_initializer.image_id} \
        sh -c 'chown -R 1000:1000 /data'
    EOT
  }
}

resource "docker_container" "kafka" {
  name           = "servir-kafka"
  hostname       = "kafka"
  image          = docker_image.kafka.image_id
  restart        = "unless-stopped"
  wait           = true
  wait_timeout   = 180
  remove_volumes = false

  env = [
    "CLUSTER_ID=${var.kafka_cluster_id}",
    "KAFKA_NODE_ID=1",
    "KAFKA_PROCESS_ROLES=broker,controller",
    "KAFKA_LISTENERS=INTERNAL://:9092,CONTROLLER://:9093,EXTERNAL://:29092",
    "KAFKA_ADVERTISED_LISTENERS=INTERNAL://kafka:9092,EXTERNAL://localhost:${var.kafka_external_port}",
    "KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=INTERNAL:PLAINTEXT,CONTROLLER:PLAINTEXT,EXTERNAL:PLAINTEXT",
    "KAFKA_INTER_BROKER_LISTENER_NAME=INTERNAL",
    "KAFKA_CONTROLLER_LISTENER_NAMES=CONTROLLER",
    "KAFKA_CONTROLLER_QUORUM_VOTERS=1@kafka:9093",
    "KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1",
    "KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR=1",
    "KAFKA_TRANSACTION_STATE_LOG_MIN_ISR=1",
    "KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS=0",
    "KAFKA_AUTO_CREATE_TOPICS_ENABLE=false",
    "KAFKA_NUM_PARTITIONS=3",
    "KAFKA_LOG_DIRS=/tmp/kraft-combined-logs",
  ]

  networks_advanced {
    name    = docker_network.platform["messaging"].name
    aliases = ["kafka"]
  }

  ports {
    internal = 29092
    external = var.kafka_external_port
    ip       = "127.0.0.1"
  }

  volumes {
    volume_name    = docker_volume.kafka_data.name
    container_path = "/tmp/kraft-combined-logs"
  }

  healthcheck {
    test         = ["CMD-SHELL", "/opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:9092 --list >/dev/null 2>&1"]
    interval     = "10s"
    timeout      = "5s"
    retries      = 12
    start_period = "20s"
  }

  labels {
    label = "servir.environment"
    value = "local"
  }

  labels {
    label = "servir.owner"
    value = "terraform"
  }

  lifecycle {
    replace_triggered_by = [terraform_data.kafka_data_permissions.id]
  }
}

resource "docker_container" "jaeger" {
  name      = "servir-jaeger"
  hostname  = "jaeger"
  image     = docker_image.jaeger.image_id
  restart   = "unless-stopped"
  must_run  = true
  read_only = true

  networks_advanced {
    name    = docker_network.platform["observability"].name
    aliases = ["jaeger"]
  }

  ports {
    internal = 16686
    external = var.jaeger_ui_port
    ip       = "127.0.0.1"
  }

  labels {
    label = "servir.environment"
    value = "local"
  }

  labels {
    label = "servir.owner"
    value = "terraform"
  }

  labels {
    label = "servir.role"
    value = "trace-backend"
  }
}

resource "docker_container" "otel_collector" {
  name      = "servir-otel-collector"
  hostname  = "otel-collector"
  image     = docker_image.otel_collector.image_id
  restart   = "unless-stopped"
  must_run  = true
  read_only = true

  command = ["--config=/etc/otelcol-contrib/config.yaml"]

  networks_advanced {
    name    = docker_network.platform["observability"].name
    aliases = ["otel-collector"]
  }

  ports {
    internal = 4318
    external = var.otel_http_port
    ip       = "127.0.0.1"
  }

  volumes {
    host_path      = abspath("${path.module}/../../../observability/otel-collector.yaml")
    container_path = "/etc/otelcol-contrib/config.yaml"
    read_only      = true
  }

  labels {
    label = "servir.environment"
    value = "local"
  }

  labels {
    label = "servir.owner"
    value = "terraform"
  }

  labels {
    label = "servir.role"
    value = "telemetry-gateway"
  }

  labels {
    label = "servir.configuration"
    value = filesha256("${path.module}/../../../observability/otel-collector.yaml")
  }

  depends_on = [docker_container.jaeger]
}

resource "docker_container" "grafana" {
  name     = "servir-grafana"
  hostname = "grafana"
  image    = docker_image.grafana.image_id
  restart  = "unless-stopped"
  must_run = true

  env = [
    "GF_AUTH_ANONYMOUS_ENABLED=true",
    "GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer",
    "GF_AUTH_DISABLE_LOGIN_FORM=true",
    "GF_USERS_ALLOW_SIGN_UP=false",
  ]

  networks_advanced {
    name    = docker_network.platform["observability"].name
    aliases = ["grafana"]
  }

  ports {
    internal = 3000
    external = var.grafana_ui_port
    ip       = "127.0.0.1"
  }

  volumes {
    host_path      = abspath("${path.module}/../../../observability/grafana/provisioning")
    container_path = "/etc/grafana/provisioning"
    read_only      = true
  }

  labels {
    label = "servir.environment"
    value = "local"
  }

  labels {
    label = "servir.owner"
    value = "terraform"
  }

  labels {
    label = "servir.role"
    value = "observability-explorer"
  }

  labels {
    label = "servir.configuration"
    value = filesha256("${path.module}/../../../observability/grafana/provisioning/datasources/jaeger.yaml")
  }

  depends_on = [docker_container.jaeger]
}

resource "docker_image" "api" {
  name         = var.api_image
  keep_locally = true
}

resource "docker_image" "outbox_relay" {
  name         = var.outbox_relay_image
  keep_locally = true
}

resource "docker_image" "frontend" {
  name         = var.frontend_image
  keep_locally = true
}

resource "docker_container" "api" {
  name        = "servir-api"
  hostname    = "api"
  image       = docker_image.api.image_id
  restart     = "unless-stopped"
  must_run    = var.api_enabled
  start       = var.api_enabled
  read_only   = true
  init        = true
  memory      = var.api_resources.memory_mb
  memory_swap = var.api_resources.memory_mb * 2
  cpu_shares  = var.api_resources.cpu_shares

  env = [for name, value in var.api_environment : "${name}=${value}"]

  dynamic "volumes" {
    for_each = var.api_jwks_file == null ? [] : [var.api_jwks_file]
    content {
      host_path      = abspath(volumes.value)
      container_path = "/run/config/servir-auth-jwks"
      read_only      = true
    }
  }

  dynamic "ports" {
    for_each = var.api_port == null ? [] : [var.api_port]
    content {
      internal = 3000
      external = ports.value
      ip       = "127.0.0.1"
    }
  }

  networks_advanced {
    name    = docker_network.platform["application"].name
    aliases = ["api"]
  }

  networks_advanced {
    name = docker_network.platform["data"].name
  }

  networks_advanced {
    name = docker_network.platform["observability"].name
  }

  healthcheck {
    test         = ["CMD", "node", "-e", "fetch('http://127.0.0.1:3000/health/live').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
    interval     = "10s"
    timeout      = "5s"
    retries      = 6
    start_period = "10s"
  }

  capabilities {
    drop = ["ALL"]
  }

  security_opts = ["no-new-privileges:true"]

  labels {
    label = "servir.environment"
    value = "local"
  }

  labels {
    label = "servir.owner"
    value = "terraform"
  }

  labels {
    label = "servir.role"
    value = "http-api"
  }

  depends_on = [docker_container.postgres, docker_container.otel_collector]
}

resource "docker_container" "frontend" {
  name        = "servir-frontend"
  hostname    = "frontend"
  image       = docker_image.frontend.image_id
  restart     = "unless-stopped"
  must_run    = var.frontend_enabled
  start       = var.frontend_enabled
  read_only   = true
  init        = true
  memory      = var.frontend_resources.memory_mb
  memory_swap = var.frontend_resources.memory_mb * 2
  cpu_shares  = var.frontend_resources.cpu_shares

  env = [for name, value in var.frontend_environment : "${name}=${value}"]

  dynamic "volumes" {
    for_each = var.frontend_private_jwk_file == null ? [] : [var.frontend_private_jwk_file]
    content {
      host_path      = abspath(volumes.value)
      container_path = "/run/secrets/servir-auth-private-jwk"
      read_only      = true
    }
  }

  networks_advanced {
    name    = docker_network.platform["edge"].name
    aliases = ["frontend"]
  }

  networks_advanced {
    name = docker_network.platform["application"].name
  }

  ports {
    internal = 3001
    external = var.frontend_port
    ip       = "127.0.0.1"
  }

  healthcheck {
    test         = ["CMD", "node", "-e", "fetch('http://127.0.0.1:3001/health/live').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
    interval     = "10s"
    timeout      = "5s"
    retries      = 6
    start_period = "10s"
  }

  capabilities {
    drop = ["ALL"]
  }

  security_opts = ["no-new-privileges:true"]

  labels {
    label = "servir.environment"
    value = "local"
  }

  labels {
    label = "servir.owner"
    value = "terraform"
  }

  labels {
    label = "servir.role"
    value = "frontend-bff"
  }

  depends_on = [docker_container.api]

  lifecycle {
    precondition {
      condition     = !var.frontend_enabled || var.api_enabled
      error_message = "frontend_enabled requires api_enabled because the BFF depends on the private API."
    }
  }
}

resource "docker_container" "outbox_relay" {
  name        = "servir-outbox-relay"
  hostname    = "outbox-relay"
  image       = docker_image.outbox_relay.image_id
  restart     = "unless-stopped"
  must_run    = var.outbox_relay_enabled
  start       = var.outbox_relay_enabled
  read_only   = true
  init        = true
  memory      = var.outbox_relay_resources.memory_mb
  memory_swap = var.outbox_relay_resources.memory_mb * 2
  cpu_shares  = var.outbox_relay_resources.cpu_shares

  env = [for name, value in var.outbox_relay_environment : "${name}=${value}"]

  networks_advanced {
    name = docker_network.platform["data"].name
  }

  networks_advanced {
    name = docker_network.platform["messaging"].name
  }

  networks_advanced {
    name = docker_network.platform["observability"].name
  }

  capabilities {
    drop = ["ALL"]
  }

  security_opts = ["no-new-privileges:true"]

  labels {
    label = "servir.environment"
    value = "local"
  }

  labels {
    label = "servir.owner"
    value = "terraform"
  }

  labels {
    label = "servir.role"
    value = "outbox-relay"
  }

  depends_on = [docker_container.postgres, docker_container.kafka, docker_container.otel_collector]
}
