import { Kafka, type KafkaConfig, type Producer } from 'kafkajs';

export interface KafkaJsProducerOptions {
  readonly clientId: string;
  readonly brokers: readonly string[];
  readonly retryCount?: number;
}

export function createKafkaJsProducer(
  options: KafkaJsProducerOptions,
): Producer {
  const kafkaConfig: KafkaConfig = {
    clientId: options.clientId,
    brokers: [...options.brokers],
    retry: {
      retries: options.retryCount ?? 5,
    },
  };

  return new Kafka(kafkaConfig).producer({
    allowAutoTopicCreation: false,
    maxInFlightRequests: 5,
  });
}
