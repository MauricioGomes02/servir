import {
  RegisterMemberHandler,
  type MemberWriteScope,
  type OrganizationRegistrationFactsReader,
} from '@/modules/membership/application';
import {
  MemberId,
  MemberRegistrationPolicy,
} from '@/modules/membership/domain';
import {
  InMemoryMemberRepository,
  InMemoryOrganizationRegistrationFactsReader,
  registerMemberRoute,
} from '@/modules/membership/infrastructure';
import {
  membershipMessageCatalog,
  RegisterMemberPresenter,
} from '@/modules/membership/presentation';
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

import { ApplicationPersistenceConfigurationError } from './application-persistence-configuration-error';

export interface CreateApplicationOptions {
  readonly logger?: Logger;
  readonly monotonicNow?: () => number;
  readonly memberUnitOfWork?: UnitOfWork<MemberWriteScope>;
  readonly organizationRegistrationFacts?: OrganizationRegistrationFactsReader;
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
      ...membershipMessageCatalog['pt-BR'],
      ...organizationMessageCatalog['pt-BR'],
    },
    'en-US': {
      ...httpProblemMessageCatalog['en-US'],
      ...membershipMessageCatalog['en-US'],
      ...organizationMessageCatalog['en-US'],
    },
  });
  const eventBus = new InMemoryEventBus();
  let unitOfWork = options.organizationUnitOfWork;
  let memberUnitOfWork = options.memberUnitOfWork;
  let organizationRegistrationFacts = options.organizationRegistrationFacts;
  let eventRelay: InMemoryEventOutboxRelay | undefined;

  if (
    unitOfWork === undefined
    && memberUnitOfWork === undefined
    && organizationRegistrationFacts === undefined
  ) {
    const organizations = new InMemoryOrganizationRepository();
    const members = new InMemoryMemberRepository();
    const outbox = new InMemoryEventOutbox();

    eventRelay = new InMemoryEventOutboxRelay(
      outbox,
      eventBus,
      logger,
    );
    unitOfWork = new DirectUnitOfWork({ organizations, outbox });
    memberUnitOfWork = new DirectUnitOfWork({ members, outbox });
    organizationRegistrationFacts =
      new InMemoryOrganizationRegistrationFactsReader(
        () => organizations.organizations.map((organization) => organization.id),
      );
  }

  if (
    unitOfWork === undefined
    || memberUnitOfWork === undefined
    || organizationRegistrationFacts === undefined
  ) {
    throw new ApplicationPersistenceConfigurationError();
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
  const registerMemberHandler = new RegisterMemberHandler({
    clock,
    memberIdGenerator: new UuidV7Generator(
      MemberId.create,
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
    organizationRegistrationFacts,
    registrationPolicy: new MemberRegistrationPolicy(),
    unitOfWork: memberUnitOfWork,
  });
  const registerMemberPresenter = new RegisterMemberPresenter(translator);
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
  registerMemberRoute(app, {
    handler: registerMemberHandler,
    messageTranslator: translator,
    presenter: registerMemberPresenter,
  });

  return app;
}
