import type { LogAttributes } from '@servir/application-foundation';

export interface ErrorLogAttributeOptions {
  readonly fallbackCode: string;
  readonly includeDetails?: boolean;
}

function errorCode(error: Error): string | undefined {
  return 'code' in error && typeof error.code === 'string'
    ? error.code
    : undefined;
}

export function createErrorLogAttributes(
  error: unknown,
  options: ErrorLogAttributeOptions,
): LogAttributes {
  if (!(error instanceof Error)) {
    return Object.freeze({
      'error.type': typeof error,
      'error.code': options.fallbackCode,
    });
  }

  const attributes: Record<string, string> = {
    'error.type': error.name,
    'error.code': errorCode(error) ?? options.fallbackCode,
  };

  if (options.includeDetails === true) {
    attributes['exception.message'] = error.message;

    if (error.stack !== undefined) {
      attributes['exception.stacktrace'] = error.stack;
    }
  }

  return Object.freeze(attributes);
}
