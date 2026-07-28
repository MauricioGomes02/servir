export class DomainEventAcknowledgementError extends Error {
  readonly code = 'aggregate_root.domain_events.acknowledgement_mismatch';

  constructor(
    readonly pendingCount: number,
    readonly acknowledgementCount: number,
  ) {
    super('Domain events do not match the pending event sequence');
    this.name = 'DomainEventAcknowledgementError';
  }
}
