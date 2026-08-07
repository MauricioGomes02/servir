import type { InMemoryEventOutboxRelay } from '@/shared/infrastructure/messaging';
import type { ServiceRegistry } from '../services';

export interface ApplicationPersistence {
  readonly services: ServiceRegistry;
  readonly eventRelay?: InMemoryEventOutboxRelay;
  close(): Promise<void>;
}
