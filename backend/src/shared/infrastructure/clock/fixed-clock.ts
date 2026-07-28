import type { Clock } from '@/shared/application/clock';
import type { Instant } from '@/shared/domain/instant';

export class FixedClock implements Clock {
  constructor(private readonly instant: Instant) {}

  now(): Instant {
    return this.instant;
  }
}
