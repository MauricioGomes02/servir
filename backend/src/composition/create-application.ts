import { CreateOrganizationHandler } from '@/modules/organizations/application';
import { OrganizationId } from '@/modules/organizations/domain';
import {
  InMemoryOrganizationRepository,
  registerCreateOrganizationRoute,
} from '@/modules/organizations/infrastructure';
import {
  CreateOrganizationPresenter,
  organizationMessageCatalog,
} from '@/modules/organizations/presentation';
import {
  parseCorrelationId,
  parseRequestId,
} from '@/shared/application/context';
import type { Logger } from '@/shared/application/logging';
import { parseMessageId } from '@/shared/application/messaging';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { SystemClock } from '@/shared/infrastructure/clock';
import { createFastifyApplication } from '@/shared/infrastructure/http';
import {
  UuidV7Generator,
  type UuidV7Source,
} from '@/shared/infrastructure/id-generator';
import { InMemoryMessageTranslator } from '@/shared/infrastructure/localization';
import {
  EventLoggingHandler,
  JsonStdoutLogger,
} from '@/shared/infrastructure/logging';
import {
  InMemoryEventBus,
  InMemoryEventOutbox,
  InMemoryEventOutboxRelay,
} from '@/shared/infrastructure/messaging';
import { DirectUnitOfWork } from '@/shared/infrastructure/unit-of-work';
import type { FastifyInstance } from 'fastify';

export interface CreateApplicationOptions {
  readonly logger?: Logger;
  readonly uuidSource?: UuidV7Source;
}

export function createApplication(
  options: CreateApplicationOptions = {},
): FastifyInstance {
  const logger = options.logger ?? new JsonStdoutLogger();
  const translator = new InMemoryMessageTranslator(
    organizationMessageCatalog,
  );
  const organizations = new InMemoryOrganizationRepository();
  const outbox = new InMemoryEventOutbox();
  const eventBus = new InMemoryEventBus();
  const eventRelay = new InMemoryEventOutboxRelay(
    outbox,
    eventBus,
    logger,
  );
  const unitOfWork = new DirectUnitOfWork({ organizations, outbox });
  const clock = new SystemClock();
  const createOrganizationHandler = new CreateOrganizationHandler({
    clock,
    organizationIdGenerator: new UuidV7Generator(
      OrganizationId.create,
      options.uuidSource,
    ),
    domainEventIdGenerator: new UuidV7Generator(
      parseDomainEventId,
      options.uuidSource,
    ),
    messageIdGenerator: new UuidV7Generator(
      parseMessageId,
      options.uuidSource,
    ),
    unitOfWork,
  });
  const createOrganizationPresenter = new CreateOrganizationPresenter(
    translator,
  );
  const app = createFastifyApplication({
    correlationIdGenerator: new UuidV7Generator(
      parseCorrelationId,
      options.uuidSource,
    ),
    logger,
    messageTranslator: translator,
    requestIdGenerator: new UuidV7Generator(
      parseRequestId,
      options.uuidSource,
    ),
  });

  eventBus.subscribe(
    'organization.created',
    new EventLoggingHandler(logger),
  );
  app.addHook('onReady', async () => {
    eventRelay.start();
  });
  app.addHook('onClose', async () => {
    await eventRelay.stop();
  });

  registerCreateOrganizationRoute(app, {
    handler: createOrganizationHandler,
    presenter: createOrganizationPresenter,
  });

  return app;
}
