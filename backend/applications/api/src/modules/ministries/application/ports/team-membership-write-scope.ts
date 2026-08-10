import type { EventOutbox } from '@/shared/application/messaging';
import type { TeamMembershipRepository } from './repositories';
export interface TeamMembershipWriteScope {
  readonly teamMemberships: TeamMembershipRepository;
  readonly outbox: EventOutbox;
}
