import type {
  EventHandler,
} from '@/shared/application/messaging';
import type { DomainEvent } from '@/shared/domain/domain-event';

import { InMemoryEventBus } from '.';

type OrganizationCreated = DomainEvent<
  'organization.created',
  Readonly<{ organizationId: string }>
>;

declare const handler: EventHandler<OrganizationCreated>;

const bus = new InMemoryEventBus();

// @ts-expect-error Handler e nome do evento devem pertencer ao mesmo contrato.
bus.subscribe<OrganizationCreated>('organization.updated', handler);
