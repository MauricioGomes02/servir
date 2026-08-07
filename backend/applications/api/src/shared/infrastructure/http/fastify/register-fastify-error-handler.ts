import type { MessageTranslator } from '@/shared/presentation';
import type { FastifyInstance } from 'fastify';

import { type FastifyRequestLogger } from './fastify-request-logger';

import {
  createHttpProblemDetails,
  HttpProblemMessageCodes,
  HttpProblemTypes,
} from '../problem-details';

interface HttpErrorLike {
  readonly statusCode?: number;
}

function errorStatus(error: unknown): number {
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    const statusCode = (error as HttpErrorLike).statusCode;

    if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
      return statusCode;
    }
  }

  return 500;
}

export function registerFastifyErrorHandler(
  app: FastifyInstance,
  requestLogger: FastifyRequestLogger,
  messageTranslator: MessageTranslator,
): void {
  app.setErrorHandler((error, request, reply) => {
    const statusCode = errorStatus(error);
    const context = requestLogger.context(request);

    if (statusCode >= 500) {
      requestLogger.markFailed(request, error);
    }

    const isInternalError = statusCode >= 500;
    const locale = request.locale;
    const type = isInternalError ? HttpProblemTypes.InternalError : HttpProblemTypes.InvalidRequest;
    const titleCode = isInternalError
      ? HttpProblemMessageCodes.InternalErrorTitle
      : HttpProblemMessageCodes.InvalidRequestTitle;

    return reply
      .status(statusCode)
      .type('application/problem+json')
      .header('content-language', locale)
      .send(
        createHttpProblemDetails({
          type,
          title: messageTranslator.translate({
            code: titleCode,
            locale,
          }),
          status: statusCode,
          correlationId: context?.correlationId,
          requestId: context?.requestId,
        }),
      );
  });
}
