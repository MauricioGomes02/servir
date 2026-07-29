import type { ClaimedOutboxMessage, IntegrationEventPublisher } from '@/application';

import { IntegrationEventPublicationError } from '@/application';

export class InMemoryIntegrationEventPublisher
implements IntegrationEventPublisher {
  private readonly publishedMessages: ClaimedOutboxMessage[] = [];

  constructor(
    private readonly failures: Readonly<Record<string, string>> = {},
  ) {}

  get messages(): readonly ClaimedOutboxMessage[] {
    return Object.freeze([...this.publishedMessages]);
  }

  async publish(message: ClaimedOutboxMessage): Promise<void> {
    const failureCode = this.failures[message.messageId];

    if (failureCode !== undefined) {
      throw new IntegrationEventPublicationError(failureCode);
    }

    this.publishedMessages.push(message);
  }
}
