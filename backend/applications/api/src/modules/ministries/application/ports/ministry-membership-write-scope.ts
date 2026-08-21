import type { EventOutbox } from '@/shared/application/messaging';
import type { MinistryMembershipRepository } from './repositories/ministry-membership-repository';
import type {
  MinistryMembershipRequestFactsReader,
  MinistryRoleQualificationFactsReader,
} from './readers';
import type { MinistryMembershipWriteLock } from './ministry-membership-write-lock';

export interface MinistryMembershipWriteScope {
  readonly membershipRequestFacts: MinistryMembershipRequestFactsReader;
  readonly ministryMemberships: MinistryMembershipRepository;
  readonly ministryRoleQualificationFacts: MinistryRoleQualificationFactsReader;
  readonly writeLock: MinistryMembershipWriteLock;
  readonly outbox: EventOutbox;
}
