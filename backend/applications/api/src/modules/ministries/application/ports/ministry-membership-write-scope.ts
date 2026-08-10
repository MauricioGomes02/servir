import type { EventOutbox } from '@/shared/application/messaging';
import type { MinistryMembershipRepository } from './repositories/ministry-membership-repository';
import type { MinistryRoleQualificationFactsReader } from './readers';

export interface MinistryMembershipWriteScope {
  readonly ministryMemberships: MinistryMembershipRepository;
  readonly ministryRoleQualificationFacts: MinistryRoleQualificationFactsReader;
  readonly outbox: EventOutbox;
}
