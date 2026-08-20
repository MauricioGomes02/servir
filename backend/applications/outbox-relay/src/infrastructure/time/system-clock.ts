import type { Clock } from '@/application';

export const SystemClockErrorCode = 'clock.system.failed' as const;

export class SystemClockError extends Error {
  override readonly name = 'SystemClockError';
  readonly code = SystemClockErrorCode;

  constructor(options?: ErrorOptions) {
    super(SystemClockErrorCode, options);
  }
}

export class SystemClock implements Clock {
  constructor(private readonly epochMilliseconds: () => number = Date.now) {}

  now(): string {
    return this.toIso(this.epochMilliseconds());
  }

  after(instant: string, milliseconds: number): string {
    return this.toIso(Date.parse(instant) + milliseconds);
  }

  private toIso(epochMilliseconds: number): string {
    try {
      if (!Number.isFinite(epochMilliseconds)) {
        throw new RangeError(SystemClockErrorCode);
      }

      return new Date(epochMilliseconds).toISOString();
    } catch (cause) {
      throw new SystemClockError({ cause });
    }
  }
}
