variable "network_name" {
  description = "Name of the user-defined Docker bridge network."
  type        = string
}

variable "network_subnet" {
  description = "IPv4 CIDR allocated to the local platform network."
  type        = string
}

variable "network_gateway" {
  description = "IPv4 gateway inside the local platform network."
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
