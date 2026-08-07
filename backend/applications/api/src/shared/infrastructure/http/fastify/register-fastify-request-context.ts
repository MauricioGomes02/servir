import {
  createExecutionContext,
  parseCorrelationId,
  parseRequestId,
  type CorrelationId,
  type ExecutionContext,
} from '@/shared/application/context';
import type { IdGenerator } from '@/shared/application/id-generator';
import {
  DefaultLocale,
  resolveLocaleCandidates,
  type SupportedLocale,
} from '@/shared/presentation';
import type { FastifyInstance } from 'fastify';

import { FastifyRequestContextError } from './fastify-request-context-error';

declare module 'fastify' {
  interface FastifyRequest {
    executionContext: ExecutionContext | null;
    locale: SupportedLocale;
  }
}

export function registerFastifyRequestContext(
  app: FastifyInstance,
  correlationIdGenerator: IdGenerator<CorrelationId>,
): void {
  app.decorateRequest('executionContext', null);
  app.decorateRequest('locale', DefaultLocale);

  app.addHook('onRequest', async (request) => {
    const parsedCorrelationId = parseCorrelationId(request.headers['x-correlation-id']);
    const correlationId = parsedCorrelationId.success
      ? parsedCorrelationId.value
      : correlationIdGenerator.generate();
    const parsedRequestId = parseRequestId(request.id);

    if (!parsedRequestId.success) {
      throw new FastifyRequestContextError(parsedRequestId.error);
    }

    request.executionContext = createExecutionContext({
      correlationId,
      requestId: parsedRequestId.value,
    });
    request.locale = resolveLocaleCandidates(request.languages());
  });

  app.addHook('onSend', async (request, reply, payload) => {
    const context = request.executionContext;

    if (context !== null) {
      void reply.header('x-correlation-id', context.correlationId);
      void reply.header('x-request-id', context.requestId);
    }

    return payload;
  });
}
