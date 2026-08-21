import type { EventOutbox } from '@/shared/application/messaging';
import type { MinistryRepository } from './repositories';
import type { MinistryCreationFactsReader } from './readers';
import type { MinistryWriteLock } from './ministry-write-lock';

export interface MinistryWriteScope {
  readonly creationFacts: MinistryCreationFactsReader;
  readonly ministries: MinistryRepository;
  readonly writeLock: MinistryWriteLock;
  readonly outbox: EventOutbox;
}
