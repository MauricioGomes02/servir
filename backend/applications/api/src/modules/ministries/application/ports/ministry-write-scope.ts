import type { EventOutbox } from '@/shared/application/messaging';
import type { MinistryRepository } from './repositories';

export interface MinistryWriteScope {
  readonly ministries: MinistryRepository;
  readonly outbox: EventOutbox;
}
