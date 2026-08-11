import type { EventOutbox } from '@/shared/application/messaging';
import type { TeamLeadershipRepository } from './repositories';

export interface TeamLeadershipWriteScope {
  readonly teamLeaderships: TeamLeadershipRepository;
  readonly outbox: EventOutbox;
}
