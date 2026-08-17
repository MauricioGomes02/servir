import type { Logger } from '@/shared/application/logging';
import type {
  AccessTokenVerifier,
  BootstrapAssertionVerifier,
} from '@/shared/application/authentication';
import type { UuidV7Source } from '@/shared/infrastructure/id-generator';
import type { ApplicationPersistence } from './persistence';

export interface CreateApplicationOptions {
  readonly accessTokenVerifier?: AccessTokenVerifier;
  readonly bootstrapAssertionVerifier?: BootstrapAssertionVerifier;
  readonly logger?: Logger;
  readonly monotonicNow?: () => number;
  readonly persistence: ApplicationPersistence;
  readonly uuidSource?: UuidV7Source;
}
