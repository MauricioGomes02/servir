import {
  parseCorrelationId,
  parseRequestId,
  type ExecutionContext,
} from '@/shared/application/context';
import {
  createLogRecord,
  LogLevels,
  type LogAttributes,
  type Logger,
} from '@/shared/application/logging';
import type { MessageTranslator } from '@/shared/presentation';
import type { FastifyInstance } from 'fastify';

import {
  createHttpProblemDetails,
  HttpProblemMessageCodes,
  HttpProblemTypes,
} from '../problem-details';

interface HttpErrorLike {
  readonly statusCode?: number;
}

interface CodedErrorLike {
  readonly code?: unknown;
}

function errorStatus(error: unknown): number {
  if (
    typeof error === 'object'
    && error !== null
    && 'statusCode' in error
  ) {
    const statusCode = (error as HttpErrorLike).statusCode;

    if (
      typeof statusCode === 'number'
      && statusCode >= 400
      && statusCode < 500
    ) {
      return statusCode;
    }
  }

  return 500;
}

function errorAttributes(error: unknown): LogAttributes {
  if (!(error instanceof Error)) {
    return {
      'error.type': typeof error,
    };
  }

  const attributes: Record<string, string> = {
    'error.type': error.name,
    'exception.message': error.message,
  };
  const code = (error as CodedErrorLike).code;

  if (typeof code === 'string') {
    attributes['error.code'] = code;
  }

  if (error.stack !== undefined) {
    attributes['exception.stacktrace'] = error.stack;
  }

  return attributes;
}

function fallbackContext(requestId: string): ExecutionContext | undefined {
  const correlationId = parseCorrelationId(requestId);
  const parsedRequestId = parseRequestId(requestId);

  if (!correlationId.success) {
    return undefined;
  }

  return {
    correlationId: correlationId.value,
    requestId: parsedRequestId.success
      ? parsedRequestId.value
      : undefined,
  };
}

export function registerFastifyErrorHandler(
  app: FastifyInstance,
  logger: Logger,
  messageTranslator: MessageTranslator,
): void {
  app.setErrorHandler((error, request, reply) => {
    const statusCode = errorStatus(error);
    const context = request.executionContext
      ?? fallbackContext(request.id);

    if (statusCode >= 500) {
      logger.log(createLogRecord({
        level: LogLevels.Error,
        eventName: 'http.request.failed',
        context,
        attributes: {
          'http.request.method': request.method,
          'http.route': request.routeOptions.url ?? 'unmatched',
          'http.response.status_code': statusCode,
          ...errorAttributes(error),
        },
      }));
    }

    const isInternalError = statusCode >= 500;
    const locale = request.locale;
    const type = isInternalError
      ? HttpProblemTypes.InternalError
      : HttpProblemTypes.InvalidRequest;
    const titleCode = isInternalError
      ? HttpProblemMessageCodes.InternalErrorTitle
      : HttpProblemMessageCodes.InvalidRequestTitle;

    return reply
      .status(statusCode)
      .type('application/problem+json')
      .header('content-language', locale)
      .send(createHttpProblemDetails({
        type,
        title: messageTranslator.translate({
          code: titleCode,
          locale,
        }),
        status: statusCode,
        correlationId: context?.correlationId,
        requestId: context?.requestId,
      }));
  });
}
