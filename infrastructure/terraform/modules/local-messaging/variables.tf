variable "topics" {
  description = "Kafka topics owned by the local messaging stack."
  type = map(object({
    name               = string
    partitions         = number
    replication_factor = number
    config             = optional(map(string), {})
  }))
}
