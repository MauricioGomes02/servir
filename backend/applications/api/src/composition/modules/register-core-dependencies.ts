import { parseCorrelationId, parseRequestId } from '@/shared/application/context';
import { parseMessageId } from '@/shared/application/messaging';
import { Mediator } from '@/shared/application/mediator';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { SystemClock } from '@/shared/infrastructure/clock';
import { httpProblemMessageCatalog } from '@/shared/infrastructure/http';
import { UuidV7Generator } from '@/shared/infrastructure/id-generator';
import { InMemoryMessageTranslator } from '@/shared/infrastructure/localization';
import { JsonStdoutLogger } from '@/shared/infrastructure/logging';
import { traceUseCase } from '@/shared/infrastructure/telemetry';
import { asFunction } from 'awilix';

import { membershipMessageCatalog } from '@/modules/membership/presentation';
import { activityMessageCatalog } from '@/modules/activities/presentation';
import { availabilityMessageCatalog } from '@/modules/availability/presentation';
import { ministryMessageCatalog } from '@/modules/ministries/presentation';
import { organizationMessageCatalog } from '@/modules/organizations/presentation';
import type { ApplicationContainer } from '../container';
import type { CreateApplicationOptions } from '../create-application-options';
import { ServiceCollection } from '../services';

export function registerCoreDependencies(
  container: ApplicationContainer,
  options: CreateApplicationOptions,
): void {
  const services = new ServiceCollection(container);
  services.addValue('logger', options.logger ?? new JsonStdoutLogger());
  services.addSingleton('mediator', () => new Mediator(traceUseCase));
  services.addSingleton('clock', () => new SystemClock());
  services.addValue(
    'eventRelayLifecycle',
    Object.freeze({ relay: options.persistence.eventRelay }),
  );
  container.register({
    translator: asFunction(
      () =>
        new InMemoryMessageTranslator({
          'pt-BR': {
            ...activityMessageCatalog['pt-BR'],
            ...availabilityMessageCatalog['pt-BR'],
            ...httpProblemMessageCatalog['pt-BR'],
            ...membershipMessageCatalog['pt-BR'],
            ...ministryMessageCatalog['pt-BR'],
            ...organizationMessageCatalog['pt-BR'],
          },
          'en-US': {
            ...activityMessageCatalog['en-US'],
            ...availabilityMessageCatalog['en-US'],
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
