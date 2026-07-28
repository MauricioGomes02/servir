import type { Instant } from '@/shared/domain/instant';

export interface Clock {
  now(): Instant;
}
