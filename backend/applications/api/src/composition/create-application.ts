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

  for (const module of applicationModules) module.registerRoutes(app, container);

  return app;
}
