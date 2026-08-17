variable "network_name" {
  description = "Name of the user-defined Docker bridge network."
  type        = string
}

variable "network_subnet" {
  description = "IPv4 CIDR allocated to the local platform network."
  type        = string
}

variable "postgres_image" {
  description = "Pinned PostgreSQL image used locally."
  type        = string
}

variable "postgres_port" {
  description = "PostgreSQL port published on the host loopback interface."
  type        = number
}

variable "postgres_database" {
  description = "Initial local PostgreSQL database."
  type        = string
}

variable "postgres_migrator_user" {
  description = "Simplified local migration identity."
  type        = string
}

variable "postgres_migrator_password" {
  description = "Simplified local migration password."
  type        = string
  sensitive   = true
}

variable "kafka_image" {
  description = "Pinned official Apache Kafka image used locally."
  type        = string
}

variable "volume_initializer_image" {
  description = "Pinned minimal image used to initialize persistent volume permissions."
  type        = string
}

variable "kafka_external_port" {
  description = "Kafka listener port published on the host loopback interface."
  type        = number
}

variable "kafka_cluster_id" {
  description = "Stable KRaft cluster identity for the persisted local broker."
  type        = string
}

variable "otel_collector_image" {
  description = "Pinned OpenTelemetry Collector Contrib image used locally."
  type        = string
}

variable "otel_http_port" {
  description = "OTLP/HTTP receiver port published on the host loopback interface."
  type        = number
}

variable "jaeger_image" {
  description = "Pinned Jaeger all-in-one image used locally."
  type        = string
}

variable "jaeger_ui_port" {
  description = "Jaeger UI port published on the host loopback interface."
  type        = number
}

variable "api_image" {
  description = "Pre-built API image reference supplied by the delivery flow."
  type        = string
}

variable "api_port" {
  description = "Optional API port published on host loopback for local development."
  type        = number
  default     = null
  nullable    = true
}

variable "outbox_relay_image" {
  description = "Pre-built outbox relay image reference supplied by the delivery flow."
  type        = string
}

variable "frontend_image" {
  description = "Pre-built frontend BFF image reference supplied by the delivery flow."
  type        = string
}

variable "frontend_port" {
  description = "Frontend BFF port published on the host loopback interface."
  type        = number
}

variable "api_enabled" {
  description = "Whether the local API container should be running."
  type        = bool
}

variable "outbox_relay_enabled" {
  description = "Whether the local outbox relay container should be running."
  type        = bool
}

variable "frontend_enabled" {
  description = "Whether the local frontend BFF container should be running."
  type        = bool
}

variable "api_resources" {
  description = "Local compute limits assigned independently to the API."
  type = object({
    cpu_shares = number
    memory_mb  = number
  })
}

variable "outbox_relay_resources" {
  description = "Local compute limits assigned independently to the outbox relay."
  type = object({
    cpu_shares = number
    memory_mb  = number
  })
}

variable "frontend_resources" {
  description = "Local compute limits assigned independently to the frontend BFF."
  type = object({
    cpu_shares = number
    memory_mb  = number
  })
}

variable "api_environment" {
  description = "Runtime environment supplied to the API by the environment composition root."
  type        = map(string)
  sensitive   = true
}

variable "outbox_relay_environment" {
  description = "Runtime environment supplied to the outbox relay by the environment composition root."
  type        = map(string)
  sensitive   = true
}

variable "frontend_environment" {
  description = "Runtime environment supplied to the frontend BFF by the environment composition root."
  type        = map(string)
  sensitive   = true
}

variable "api_jwks_file" {
  description = "Optional host path mounted read-only with the API public JWKS."
  type        = string
  default     = null
  nullable    = true
}

variable "frontend_private_jwk_file" {
  description = "Optional host path mounted read-only with the frontend BFF private JWK."
  type        = string
  default     = null
  nullable    = true
  sensitive   = true
}
