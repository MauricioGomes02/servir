resource "kafka_topic" "managed" {
  for_each = var.topics

  name               = each.value.name
  partitions         = each.value.partitions
  replication_factor = each.value.replication_factor
  config             = each.value.config

  lifecycle {
    prevent_destroy = true
  }
}
