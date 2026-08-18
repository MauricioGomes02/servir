import type { EventOutbox } from '@/shared/application/messaging';
import type { OrganizationAccessRepository } from '@/modules/identity/application';

import type { OrganizationRepository } from './repositories';

export interface OrganizationWriteScope {
  readonly organizations: OrganizationRepository;
  readonly organizationAccesses: OrganizationAccessRepository;
  readonly outbox: EventOutbox;
}
