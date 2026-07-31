import type {
  CorrelationId,
  RequestId,
} from '@/shared/application/context';
import type { IdGenerator } from '@/shared/application/id-generator';
import type { Logger } from '@/shared/application/logging';
import type { MessageTranslator } from '@/shared/presentation';
import accepts from '@fastify/accepts';
import Fastify, {
  type FastifyInstance,
} from 'fastify';

import { registerFastifyErrorHandler } from './register-fastify-error-handler';
import { registerFastifyRequestContext } from './register-fastify-request-context';
import { registerFastifyRequestLogging } from './register-fastify-request-logging';
import {
  FastifyRequestLogger,
  type MonotonicNow,
} from './fastify-request-logger';

export interface CreateFastifyApplicationDependencies {
  readonly correlationIdGenerator: IdGenerator<CorrelationId>;
  readonly logger: Logger;
  readonly messageTranslator: MessageTranslator;
  readonly monotonicNow?: MonotonicNow;
  readonly requestIdGenerator: IdGenerator<RequestId>;
}

export function createFastifyApplication(
  dependencies: CreateFastifyApplicationDependencies,
): FastifyInstance {
  const app = Fastify({
    logger: false,
    requestIdHeader: false,
    genReqId: () => dependencies.requestIdGenerator.generate(),
  });

  void app.register(accepts);
  const requestLogger = new FastifyRequestLogger(
    dependencies.logger,
    dependencies.monotonicNow,
  );
  registerFastifyRequestLogging(app, requestLogger);
  registerFastifyRequestContext(app, dependencies.correlationIdGenerator);
  registerFastifyErrorHandler(
    app,
    requestLogger,
    dependencies.messageTranslator,
  );

  return app;
}
