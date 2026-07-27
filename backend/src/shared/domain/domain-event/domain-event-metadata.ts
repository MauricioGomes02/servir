import {
  failure,
  success,
  type Result,
} from '@/shared/core/result';

import {
  DomainEventMetadataErrorCodes,
  type DomainEventMetadataError,
} from './domain-event-metadata-error';

const MAX_DOMAIN_EVENT_ID_LENGTH = 128;

declare const domainEventIdBrand: unique symbol;

export type DomainEventId = string & {
  readonly [domainEventIdBrand]: 'DomainEventId';
};

export function parseDomainEventId(
  input: unknown,
): Result<DomainEventId, DomainEventMetadataError> {
  if (typeof input !== 'string') {
    return failure({
      code: DomainEventMetadataErrorCodes.InvalidType,
      field: 'eventId',
    });
  }

  const value = input.trim();

  if (value.length === 0) {
    return failure({
      code: DomainEventMetadataErrorCodes.Empty,
      field: 'eventId',
    });
  }

  if (value.length > MAX_DOMAIN_EVENT_ID_LENGTH) {
    return failure({
      code: DomainEventMetadataErrorCodes.TooLong,
      field: 'eventId',
      params: {
        maxLength: MAX_DOMAIN_EVENT_ID_LENGTH,
        actualLength: value.length,
      },
    });
  }

  return success(value as DomainEventId);
}
