import type { EventOutbox } from '@/shared/application/messaging';
import type { MinistryTeamRepository } from './repositories';
export interface MinistryTeamWriteScope {
  readonly ministryTeams: MinistryTeamRepository;
  readonly outbox: EventOutbox;
}
