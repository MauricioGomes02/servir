export class SystemClockError extends Error {
  readonly code = 'clock.system.failure';

  constructor(cause: unknown) {
    super('System clock failed to produce a valid Instant', {
      cause,
    });

    this.name = 'SystemClockError';
  }
}
