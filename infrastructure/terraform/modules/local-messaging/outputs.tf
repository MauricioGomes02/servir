output "topics" {
  description = "Topic names reconciled by Terraform."
  value = {
    for key, topic in kafka_topic.managed : key => topic.name
  }
}
