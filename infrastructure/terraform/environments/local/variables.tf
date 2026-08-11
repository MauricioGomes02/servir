variable "network_name" {
  description = "Name of the user-defined Docker bridge network."
  type        = string
  default     = "servir-platform"
}

variable "network_subnet" {
  description = "IPv4 parent CIDR split into edge, data, messaging, and observability bridge networks."
  type        = string
  default     = "172.28.0.0/24"
}

variable "network_gateway" {
  description = "Deprecated compatibility input; gateways are derived from network_subnet."
  type        = string
  default     = null
  nullable    = true
}

variable "postgres_image" {
  description = "Pinned PostgreSQL image used locally."
  type        = string
  default     = "postgres:18.4-alpine"
}

variable "postgres_port" {
  description = "PostgreSQL port published only on host loopback."
  type        = number
  default     = 5432

  validation {
    condition     = var.postgres_port >= 1 && var.postgres_port <= 65535
    error_message = "postgres_port must be between 1 and 65535."
  }
}

variable "postgres_database" {
  description = "Initial local PostgreSQL database."
  type        = string
  default     = "servir"
}

variable "postgres_migrator_user" {
  description = "Simplified migration identity used only in local development."
  type        = string
  default     = "servir_migrator"
}

variable "postgres_migrator_password" {
  description = "Simplified migration password used only in local development."
  type        = string
  sensitive   = true
  default     = "servir_migrator_local"
}

variable "kafka_image" {
  description = "Pinned official Apache Kafka image used locally."
  type        = string
  default     = "apache/kafka:4.1.2"
}

variable "volume_initializer_image" {
  description = "Pinned minimal image used to initialize persistent volume permissions."
  type        = string
  default     = "busybox:1.37.0"
}

variable "kafka_external_port" {
  description = "Kafka port published only on host loopback."
  type        = number
  default     = 29092

  validation {
    condition     = var.kafka_external_port >= 1 && var.kafka_external_port <= 65535
    error_message = "kafka_external_port must be between 1 and 65535."
  }
}

variable "kafka_cluster_id" {
  description = "Stable KRaft cluster identity associated with the protected Kafka volume."
  type        = string
  default     = "MkU3OEVBNTcwNTJENDM2Qk"
}

variable "otel_collector_image" {
  description = "Pinned OpenTelemetry Collector Contrib image used locally."
  type        = string
  default     = "otel/opentelemetry-collector-contrib:0.157.0"
}

variable "otel_http_port" {
  description = "OTLP/HTTP receiver port published only on host loopback."
  type        = number
  default     = 4318

  validation {
    condition     = var.otel_http_port >= 1 && var.otel_http_port <= 65535
    error_message = "otel_http_port must be between 1 and 65535."
  }
}

variable "jaeger_image" {
  description = "Pinned Jaeger all-in-one image used locally."
  type        = string
  default     = "cr.jaegertracing.io/jaegertracing/jaeger:2.20.0"
}

variable "jaeger_ui_port" {
  description = "Jaeger UI port published only on host loopback."
  type        = number
  default     = 16686

  validation {
    condition     = var.jaeger_ui_port >= 1 && var.jaeger_ui_port <= 65535
    error_message = "jaeger_ui_port must be between 1 and 65535."
  }
}

variable "api_image" {
  description = "Pre-built API image available to the local Docker daemon."
  type        = string
  default     = "servir-api:local"
}

variable "api_port" {
  description = "API port published only on host loopback."
  type        = number
  default     = 3000

  validation {
    condition     = var.api_port >= 1 && var.api_port <= 65535
    error_message = "api_port must be between 1 and 65535."
  }
}

variable "outbox_relay_image" {
  description = "Pre-built outbox relay image available to the local Docker daemon."
  type        = string
  default     = "servir-outbox-relay:local"
}

variable "api_enabled" {
  description = "Starts the API after Liquibase has prepared the schema."
  type        = bool
  default     = false
}

variable "outbox_relay_enabled" {
  description = "Starts the outbox relay after Liquibase has prepared the schema and Kafka topics."
  type        = bool
  default     = false
}

variable "api_resources" {
  description = "Compute resources reserved for the local API container."
  type = object({
    cpu_shares = number
    memory_mb  = number
  })
}

variable "outbox_relay_resources" {
  description = "Compute resources reserved for the local outbox relay container."
  type = object({
    cpu_shares = number
    memory_mb  = number
  })
}

variable "api_environment" {
  description = "Complete runtime environment for the API container."
  type        = map(string)
  sensitive   = true
}

variable "outbox_relay_environment" {
  description = "Complete runtime environment for the outbox relay container."
  type        = map(string)
  sensitive   = true
}
