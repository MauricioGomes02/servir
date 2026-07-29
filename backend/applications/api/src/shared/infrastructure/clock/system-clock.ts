import type { Clock } from '@/shared/application/clock';
import { Instant } from '@/shared/domain/instant';

import { SystemClockError } from './system-clock-error';

export class SystemClock implements Clock {
  constructor(
    private readonly currentEpochMilliseconds: () => number = Date.now,
  ) {}

  now(): Instant {
    try {
      const isoString = new Date(
        this.currentEpochMilliseconds(),
      ).toISOString();
      const instant = Instant.create(isoString);

      if (!instant.success) {
        throw instant.error;
      }

      return instant.value;
    } catch (cause) {
      throw new SystemClockError(cause);
    }
  }
}
