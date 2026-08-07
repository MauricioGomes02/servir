export type { IntegrationEvent } from '@servir/integration-messaging';

import type { IntegrationEvent } from '@servir/integration-messaging';
import type { EventEnvelope } from './event-envelope';

export type IntegrationEventMapper = (envelope: EventEnvelope) => IntegrationEvent;
