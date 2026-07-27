import {
  failure,
  success,
  type Result,
} from '@/shared/core/result';

import {
  MessageIdErrorCodes,
  type MessageIdError,
} from './message-id-error';

const MAX_MESSAGE_ID_LENGTH = 128;

declare const messageIdBrand: unique symbol;

export type MessageId = string & {
  readonly [messageIdBrand]: 'MessageId';
};

export function parseMessageId(
  input: unknown,
): Result<MessageId, MessageIdError> {
  if (typeof input !== 'string') {
    return failure({
      code: MessageIdErrorCodes.InvalidType,
      field: 'messageId',
    });
  }

  const value = input.trim();

  if (value.length === 0) {
    return failure({
      code: MessageIdErrorCodes.Empty,
      field: 'messageId',
    });
  }

  if (value.length > MAX_MESSAGE_ID_LENGTH) {
    return failure({
      code: MessageIdErrorCodes.TooLong,
      field: 'messageId',
      params: {
        maxLength: MAX_MESSAGE_ID_LENGTH,
        actualLength: value.length,
      },
    });
  }

  return success(value as MessageId);
}
