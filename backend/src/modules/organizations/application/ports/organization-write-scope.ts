import type { EventOutbox } from '@/shared/application/messaging';

import type { OrganizationRepository } from './organization-repository';

export interface OrganizationWriteScope {
  readonly organizations: OrganizationRepository;
  readonly outbox: EventOutbox;
}
