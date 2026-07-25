import type {
  NotificationError,
} from '@/shared/domain/notification';

export const EntityIdErrorCodes = {
  InvalidType: 'entity_id.invalid_type',
  InvalidFormat: 'entity_id.invalid_format',
  InvalidVersion: 'entity_id.invalid_version',
} as const;

export type EntityIdErrorCode =
  (typeof EntityIdErrorCodes)[keyof typeof EntityIdErrorCodes];

export type EntityIdError =
  NotificationError<EntityIdErrorCode>;