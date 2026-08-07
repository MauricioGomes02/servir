import { parseCorrelationId, parseRequestId } from '@/shared/application/context';
import { parseMessageId } from '@/shared/application/messaging';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { SystemClock } from '@/shared/infrastructure/clock';
import { httpProblemMessageCatalog } from '@/shared/infrastructure/http';
import { UuidV7Generator } from '@/shared/infrastructure/id-generator';
import { InMemoryMessageTranslator } from '@/shared/infrastructure/localization';
import { JsonStdoutLogger } from '@/shared/infrastructure/logging';
import { asFunction, asValue } from 'awilix';

import { membershipMessageCatalog } from '@/modules/membership/presentation';
import { ministryMessageCatalog } from '@/modules/ministries/presentation';
import { organizationMessageCatalog } from '@/modules/organizations/presentation';
import type { ApplicationContainer } from '../container';
import type { CreateApplicationOptions } from '../create-application-options';

export function registerCoreDependencies(
  container: ApplicationContainer,
  options: CreateApplicationOptions,
): void {
  container.register({
    logger: asValue(options.logger ?? new JsonStdoutLogger()),
    clock: asFunction(() => new SystemClock()).singleton(),
    translator: asFunction(
      () =>
        new InMemoryMessageTranslator({
          'pt-BR': {
            ...httpProblemMessageCatalog['pt-BR'],
            ...membershipMessageCatalog['pt-BR'],
            ...ministryMessageCatalog['pt-BR'],
            ...organizationMessageCatalog['pt-BR'],
          },
          'en-US': {
            ...httpProblemMessageCatalog['en-US'],
            ...membershipMessageCatalog['en-US'],
            ...ministryMessageCatalog['en-US'],
            ...organizationMessageCatalog['en-US'],
          },
        }),
    ).singleton(),
    domainEventIdGenerator: asFunction(
      () => new UuidV7Generator(parseDomainEventId, options.uuidSource),
    ).singleton(),
    messageIdGenerator: asFunction(
      () => new UuidV7Generator(parseMessageId, options.uuidSource),
    ).singleton(),
    requestIdGenerator: asFunction(
      () => new UuidV7Generator(parseRequestId, options.uuidSource),
    ).singleton(),
    correlationIdGenerator: asFunction(
      () => new UuidV7Generator(parseCorrelationId, options.uuidSource),
    ).singleton(),
  });
}
