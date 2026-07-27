export const MessageIdErrorCodes = {
  InvalidType: 'message_id.invalid_type',
  Empty: 'message_id.empty',
  TooLong: 'message_id.too_long',
} as const;

export type MessageIdErrorCode =
  (typeof MessageIdErrorCodes)[keyof typeof MessageIdErrorCodes];

export interface MessageIdError {
  readonly code: MessageIdErrorCode;
  readonly field: 'messageId';
  readonly params?: Readonly<{
    maxLength: number;
    actualLength: number;
  }>;
}
