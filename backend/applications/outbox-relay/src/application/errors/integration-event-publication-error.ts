export const IntegrationEventPublicationErrorCode = 'integration_event.publish_failed' as const;

export class IntegrationEventPublicationError extends Error {
  readonly code: string;
  readonly retryable: boolean;

  constructor(
    code: string = IntegrationEventPublicationErrorCode,
    options: Readonly<{ cause?: unknown; retryable?: boolean }> = {},
  ) {
    super(code, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'IntegrationEventPublicationError';
    this.code = code;
    this.retryable = options.retryable ?? true;
  }
}

export interface PublicationFailure {
  readonly code: string;
  readonly retryable: boolean;
}

export function publicationFailure(error: unknown): PublicationFailure {
  if (error instanceof IntegrationEventPublicationError) {
    return Object.freeze({
      code: error.code,
      retryable: error.retryable,
    });
  }

  return Object.freeze({
    code: IntegrationEventPublicationErrorCode,
    retryable: true,
  });
}
