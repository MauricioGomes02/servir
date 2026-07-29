export const IntegrationEventPublicationErrorCode =
  'integration_event.publish_failed' as const;

export class IntegrationEventPublicationError extends Error {
  readonly code: string;

  constructor(code: string = IntegrationEventPublicationErrorCode) {
    super(code);
    this.name = 'IntegrationEventPublicationError';
    this.code = code;
  }
}

export function publicationErrorCode(error: unknown): string {
  return error instanceof IntegrationEventPublicationError
    ? error.code
    : IntegrationEventPublicationErrorCode;
}
