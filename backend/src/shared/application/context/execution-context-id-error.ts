export const ExecutionContextIdErrorCodes = {
  InvalidType: 'execution_context_id.invalid_type',
  Empty: 'execution_context_id.empty',
  TooLong: 'execution_context_id.too_long',
} as const;

export type ExecutionContextIdErrorCode =
  (typeof ExecutionContextIdErrorCodes)[keyof typeof ExecutionContextIdErrorCodes];

export interface ExecutionContextIdError {
  readonly code: ExecutionContextIdErrorCode;
  readonly field: 'correlationId' | 'requestId';
  readonly params?: Readonly<{
    maxLength: number;
    actualLength: number;
  }>;
}
