export type { IntegrationEvent } from '@servir/integration-messaging';

import type { IntegrationEvent } from '@servir/integration-messaging';

export type IntegrationEventMapper = (
  envelope: import('./event-envelope').EventEnvelope,
) => IntegrationEvent;
