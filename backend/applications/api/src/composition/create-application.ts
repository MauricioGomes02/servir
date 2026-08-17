import { createFastifyApplication } from '@/shared/infrastructure/http';
import type { FastifyInstance } from 'fastify';

import { createApplicationContainer } from './container';
import type { CreateApplicationOptions } from './create-application-options';
import { applicationModules } from './modules';

export type { CreateApplicationOptions } from './create-application-options';

export function createApplication(options: CreateApplicationOptions): FastifyInstance {
  const container = createApplicationContainer(options);
  const dependencies = container.cradle;
  const app = createFastifyApplication({
    accessTokenVerifier: options.accessTokenVerifier,
    correlationIdGenerator: dependencies.correlationIdGenerator,
    logger: dependencies.logger,
    messageTranslator: dependencies.translator,
    monotonicNow: options.monotonicNow,
    requestIdGenerator: dependencies.requestIdGenerator,
  });
  const eventRelay = dependencies.eventRelayLifecycle.relay;

  if (eventRelay !== undefined) {
    app.addHook('onReady', async () => {
      eventRelay.start();
    });
    app.addHook('onClose', async () => {
      await eventRelay.stop();
    });
  }

  app.addHook('onClose', async () => {
    await options.persistence.close();
  });

  app.get('/health/live', async (_request, reply) =>
    reply.status(200).send(Object.freeze({ status: 'ok' })),
  );

  for (const module of applicationModules) module.registerRoutes(app, container, options);

  return app;
}
