import {
  CreateOrganizationHandler,
  type OrganizationWriteScope,
} from '@/modules/organizations/application';
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
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { SystemClock } from '@/shared/infrastructure/clock';
import {
  createFastifyApplication,
  httpProblemMessageCatalog,
} from '@/shared/infrastructure/http';
import {
  UuidV7Generator,
  type UuidV7Source,
} from '@/shared/infrastructure/id-generator';
import { InMemoryMessageTranslator } from '@/shared/infrastructure/localization';
import {
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
  readonly monotonicNow?: () => number;
  readonly organizationUnitOfWork?: UnitOfWork<OrganizationWriteScope>;
  readonly uuidSource?: UuidV7Source;
}

export function createApplication(
  options: CreateApplicationOptions = {},
): FastifyInstance {
  const logger = options.logger ?? new JsonStdoutLogger();
  const translator = new InMemoryMessageTranslator({
    'pt-BR': {
      ...httpProblemMessageCatalog['pt-BR'],
      ...organizationMessageCatalog['pt-BR'],
    },
    'en-US': {
      ...httpProblemMessageCatalog['en-US'],
      ...organizationMessageCatalog['en-US'],
    },
  });
  const eventBus = new InMemoryEventBus();
  let unitOfWork = options.organizationUnitOfWork;
  let eventRelay: InMemoryEventOutboxRelay | undefined;

  if (unitOfWork === undefined) {
    const organizations = new InMemoryOrganizationRepository();
    const outbox = new InMemoryEventOutbox();

    eventRelay = new InMemoryEventOutboxRelay(
      outbox,
      eventBus,
      logger,
    );
    unitOfWork = new DirectUnitOfWork({ organizations, outbox });
  }
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
    monotonicNow: options.monotonicNow,
    requestIdGenerator: new UuidV7Generator(
      parseRequestId,
      options.uuidSource,
    ),
  });

  if (eventRelay !== undefined) {
    app.addHook('onReady', async () => {
      eventRelay?.start();
    });
    app.addHook('onClose', async () => {
      await eventRelay?.stop();
    });
  }

  registerCreateOrganizationRoute(app, {
    handler: createOrganizationHandler,
    messageTranslator: translator,
    presenter: createOrganizationPresenter,
  });

  return app;
}
