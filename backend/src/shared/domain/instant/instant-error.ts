export const InstantErrorCodes = {
  InvalidType: 'instant.invalid_type',
  InvalidFormat: 'instant.invalid_format',
} as const;

export type InstantErrorCode =
  (typeof InstantErrorCodes)[keyof typeof InstantErrorCodes];

export interface InstantError {
  readonly code: InstantErrorCode;
  readonly field: 'instant';
}
