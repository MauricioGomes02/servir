resource "docker_network" "platform" {
  name       = var.network_name
  driver     = "bridge"
  attachable = true

  ipam_config {
    subnet  = var.network_subnet
    gateway = var.network_gateway
  }

  labels {
    label = "com.servir.environment"
    value = "local"
  }

  labels {
    label = "com.servir.owner"
    value = "terraform"
  }
}

resource "docker_volume" "postgres_data" {
  name = "servir-postgres-data"

  labels {
    label = "com.servir.environment"
    value = "local"
  }

  labels {
    label = "com.servir.owner"
    value = "terraform"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "docker_volume" "kafka_data" {
  name = "servir-kafka-data"

  labels {
    label = "com.servir.environment"
    value = "local"
  }

  labels {
    label = "com.servir.owner"
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
    name    = docker_network.platform.name
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
    label = "com.servir.environment"
    value = "local"
  }

  labels {
    label = "com.servir.owner"
    value = "terraform"
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
    name    = docker_network.platform.name
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
    label = "com.servir.environment"
    value = "local"
  }

  labels {
    label = "com.servir.owner"
    value = "terraform"
  }
}
