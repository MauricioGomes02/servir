module "messaging" {
  source = "../../modules/local-messaging"

  topics = var.topics
}
