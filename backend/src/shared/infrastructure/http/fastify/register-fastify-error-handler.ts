import {
  parseCorrelationId,
  type ExecutionContext,
} from '@/shared/application/context';
import {
  createLogRecord,
  LogLevels,
  type LogAttributes,
  type Logger,
} from '@/shared/application/logging';
import {
  DefaultLocale,
  presentError,
  type MessageTranslator,
} from '@/shared/presentation';
import type { FastifyInstance } from 'fastify';

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

  if (!correlationId.success) {
    return undefined;
  }

  return {
    correlationId: correlationId.value,
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

    const code = statusCode >= 500
      ? 'internal.error'
      : 'request.invalid';
    const locale = request.locale ?? DefaultLocale;

    if (context === undefined) {
      return reply.status(statusCode).send({
        success: false,
        error: {
          code,
          message: messageTranslator.translate({
            code,
            locale,
          }),
        },
      });
    }

    return reply.status(statusCode).send({
      success: false,
      error: presentError(
        { code },
        context,
        locale,
        messageTranslator,
      ),
    });
  });
}
