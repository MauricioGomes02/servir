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

export interface CreateFastifyApplicationDependencies {
  readonly correlationIdGenerator: IdGenerator<CorrelationId>;
  readonly logger: Logger;
  readonly messageTranslator: MessageTranslator;
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
  registerFastifyRequestContext(app, dependencies.correlationIdGenerator);
  registerFastifyErrorHandler(
    app,
    dependencies.logger,
    dependencies.messageTranslator,
  );

  return app;
}
