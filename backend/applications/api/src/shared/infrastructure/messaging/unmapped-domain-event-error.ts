export const UnmappedDomainEventErrorCode =
  'integration_event.unmapped_domain_event' as const;

export class UnmappedDomainEventError extends Error {
  readonly code = UnmappedDomainEventErrorCode;

  constructor(readonly eventName: string) {
    super(UnmappedDomainEventErrorCode);
    this.name = 'UnmappedDomainEventError';
  }
}
