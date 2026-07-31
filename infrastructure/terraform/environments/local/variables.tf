variable "network_name" {
  description = "Name of the user-defined Docker bridge network."
  type        = string
  default     = "servir-platform"
}

variable "network_subnet" {
  description = "IPv4 CIDR reserved for the local platform network. Change it if it overlaps another Docker/VPN network."
  type        = string
  default     = "172.28.0.0/24"
}

variable "network_gateway" {
  description = "IPv4 gateway inside the local platform network."
  type        = string
  default     = "172.28.0.1"
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
