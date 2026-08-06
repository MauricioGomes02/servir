import type {
  CorrelationId,
  RequestId,
} from '@/shared/application/context';
import type { PresentedError } from '@/shared/presentation';

export const HttpProblemTypes = {
  InternalError: '/problems/internal-error',
  InvalidRequest: '/problems/invalid-request',
  ResourceConflict: '/problems/resource-conflict',
  ResourceNotFound: '/problems/resource-not-found',
  ValidationError: '/problems/validation-error',
} as const;

export interface HttpProblemDetails {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly instance?: string;
  readonly correlationId?: string;
}

export interface ValidationProblemError {
  readonly code: string;
  readonly detail: string;
  readonly pointer?: string;
  readonly parameters?: PresentedError['parameters'];
}

export interface ValidationProblemDetails extends HttpProblemDetails {
  readonly errors: ReadonlyArray<ValidationProblemError>;
}

interface CreateHttpProblemDetailsInput {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly requestId?: RequestId;
  readonly correlationId?: CorrelationId;
}

interface CreateValidationProblemDetailsInput {
  readonly type?: string;
  readonly title: string;
  readonly status: number;
  readonly requestId?: RequestId;
  readonly correlationId: CorrelationId;
  readonly errors: ReadonlyArray<PresentedError>;
}

function fieldPointer(field: string | undefined): string | undefined {
  if (field === undefined) {
    return undefined;
  }

  const escapedField = field
    .replaceAll('~', '~0')
    .replaceAll('/', '~1');

  return `#/${escapedField}`;
}

export function createHttpProblemDetails(
  input: CreateHttpProblemDetailsInput,
): HttpProblemDetails {
  return Object.freeze({
    type: input.type,
    title: input.title,
    status: input.status,
    ...(input.requestId === undefined
      ? {}
      : { instance: `urn:servir:request:${input.requestId}` }),
    ...(input.correlationId === undefined
      ? {}
      : { correlationId: input.correlationId }),
  });
}

export function createValidationProblemDetails(
  input: CreateValidationProblemDetailsInput,
): ValidationProblemDetails {
  return Object.freeze({
    ...createHttpProblemDetails({
      type: input.type ?? HttpProblemTypes.ValidationError,
      title: input.title,
      status: input.status,
      requestId: input.requestId,
      correlationId: input.correlationId,
    }),
    errors: Object.freeze(input.errors.map((error) => Object.freeze({
      code: error.code,
      detail: error.message,
      ...(error.field === undefined
        ? {}
        : { pointer: fieldPointer(error.field) }),
      ...(error.parameters === undefined
        ? {}
        : { parameters: error.parameters }),
    }))),
  });
}
