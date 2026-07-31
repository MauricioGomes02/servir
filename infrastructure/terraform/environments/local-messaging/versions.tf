terraform {
  required_version = ">= 1.10.0, < 2.0.0"

  required_providers {
    kafka = {
      source  = "Mongey/kafka"
      version = "0.13.1"
    }
  }
}
