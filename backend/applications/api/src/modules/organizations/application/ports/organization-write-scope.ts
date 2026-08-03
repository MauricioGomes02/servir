import type { EventOutbox } from '@/shared/application/messaging';

import type { OrganizationRepository } from './repositories';

export interface OrganizationWriteScope {
  readonly organizations: OrganizationRepository;
  readonly outbox: EventOutbox;
}
