export const DomainEventMetadataErrorCodes = {
  InvalidType: 'domain_event_metadata.invalid_type',
  Empty: 'domain_event_metadata.empty',
  TooLong: 'domain_event_metadata.too_long',
  InvalidFormat: 'domain_event_metadata.invalid_format',
} as const;

export type DomainEventMetadataErrorCode =
  (typeof DomainEventMetadataErrorCodes)[keyof typeof DomainEventMetadataErrorCodes];

export interface DomainEventMetadataError {
  readonly code: DomainEventMetadataErrorCode;
  readonly field: 'eventId';
  readonly params?: Readonly<{
    maxLength: number;
    actualLength: number;
  }>;
}
