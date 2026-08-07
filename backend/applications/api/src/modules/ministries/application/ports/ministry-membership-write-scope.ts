import type { EventOutbox } from '@/shared/application/messaging';
import type { MinistryMembershipRepository } from './repositories/ministry-membership-repository';

export interface MinistryMembershipWriteScope {
  readonly ministryMemberships: MinistryMembershipRepository;
  readonly outbox: EventOutbox;
}
