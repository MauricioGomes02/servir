import type { IntegrationEvent } from '@servir/integration-messaging';

import type { ClaimedOutboxMessage } from './outbox-message-store';

export interface IntegrationEventPublisher {
  publish(message: ClaimedOutboxMessage<IntegrationEvent>): Promise<void>;
}
