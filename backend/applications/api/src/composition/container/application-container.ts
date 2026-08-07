import type {
  MemberDetailsReader,
  MemberWriteScope,
  OrganizationRegistrationFactsReader,
} from '@/modules/membership/application';
import type { OrganizationWriteScope } from '@/modules/organizations/application';
import type {
  MinistryCreationFactsReader,
  MinistryMembershipRequestFactsReader,
  MinistryMembershipWriteScope,
  MinistryWriteScope,
} from '@/modules/ministries/application';
import type { Clock } from '@/shared/application/clock';
import type { CorrelationId, RequestId } from '@/shared/application/context';
import type { IdGenerator } from '@/shared/application/id-generator';
import type { Logger } from '@/shared/application/logging';
import type { Mediator } from '@/shared/application/mediator';
import type { MessageId } from '@/shared/application/messaging';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import type { DomainEventId } from '@/shared/domain/domain-event';
import type { InMemoryEventOutboxRelay } from '@/shared/infrastructure/messaging';
import type { MessageTranslator } from '@/shared/presentation';
import type { AwilixContainer } from 'awilix';

export interface EventRelayLifecycle {
  readonly relay?: InMemoryEventOutboxRelay;
}

export interface ApplicationCradle {
  readonly logger: Logger;
  readonly mediator: Mediator;
  readonly translator: MessageTranslator;
  readonly clock: Clock;
  readonly organizationUnitOfWork: UnitOfWork<OrganizationWriteScope>;
  readonly memberUnitOfWork: UnitOfWork<MemberWriteScope>;
  readonly memberDetailsReader: MemberDetailsReader;
  readonly organizationRegistrationFacts: OrganizationRegistrationFactsReader;
  readonly ministryUnitOfWork: UnitOfWork<MinistryWriteScope>;
  readonly ministryCreationFacts: MinistryCreationFactsReader;
  readonly ministryMembershipUnitOfWork: UnitOfWork<MinistryMembershipWriteScope>;
  readonly ministryMembershipRequestFacts: MinistryMembershipRequestFactsReader;
  readonly eventRelayLifecycle: EventRelayLifecycle;
  readonly domainEventIdGenerator: IdGenerator<DomainEventId>;
  readonly messageIdGenerator: IdGenerator<MessageId>;
  readonly requestIdGenerator: IdGenerator<RequestId>;
  readonly correlationIdGenerator: IdGenerator<CorrelationId>;
}

export type ApplicationContainer = AwilixContainer<ApplicationCradle>;
