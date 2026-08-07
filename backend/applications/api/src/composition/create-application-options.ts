import type { Logger } from '@/shared/application/logging';
import type { UuidV7Source } from '@/shared/infrastructure/id-generator';
import type { ApplicationPersistence } from './persistence';

export interface CreateApplicationOptions {
  readonly logger?: Logger;
  readonly monotonicNow?: () => number;
  readonly persistence: ApplicationPersistence;
  readonly uuidSource?: UuidV7Source;
}
