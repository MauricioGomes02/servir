variable "kafka_bootstrap_servers" {
  description = "Kafka endpoints reachable from the host running Terraform."
  type        = list(string)
  default     = ["localhost:29092"]

  validation {
    condition = length(var.kafka_bootstrap_servers) > 0 && alltrue([
      for server in var.kafka_bootstrap_servers : length(trimspace(server)) > 0
    ])
    error_message = "kafka_bootstrap_servers must contain at least one non-empty endpoint."
  }
}

variable "topics" {
  description = "Versioned topic catalog for the local environment."
  type = map(object({
    name               = string
    partitions         = number
    replication_factor = number
    config             = optional(map(string), {})
  }))

  default = {
    organizations_events = {
      name               = "servir.organizations.events"
      partitions         = 3
      replication_factor = 1
    }
  }

  validation {
    condition = alltrue([
      for topic in values(var.topics) :
      length(trimspace(topic.name)) > 0
      && topic.partitions > 0
      && topic.replication_factor > 0
    ])
    error_message = "Every topic must have a name, at least one partition, and a positive replication factor."
  }
}
