import type {
  GetMemberDetailsHandler,
  MemberDetailsReader,
  MemberWriteScope,
  OrganizationRegistrationFactsReader,
  RegisterMemberHandler,
} from '@/modules/membership/application';
import type { MemberId } from '@/modules/membership/domain';
import type {
  GetMemberDetailsPresenter,
  RegisterMemberPresenter,
} from '@/modules/membership/presentation';
import type {
  CreateOrganizationHandler,
  OrganizationWriteScope,
} from '@/modules/organizations/application';
import type { OrganizationId } from '@/modules/organizations/domain';
import type { CreateOrganizationPresenter } from '@/modules/organizations/presentation';
import type {
  CreateMinistryHandler,
  DefineMinistryRoleHandler,
  MinistryCreationFactsReader,
  MinistryWriteScope,
} from '@/modules/ministries/application';
import type { MinistryId, MinistryRoleId } from '@/modules/ministries/domain';
import type { CreateMinistryPresenter, DefineMinistryRolePresenter } from '@/modules/ministries/presentation';
import type { Clock } from '@/shared/application/clock';
import type {
  CorrelationId,
  RequestId,
} from '@/shared/application/context';
import type { IdGenerator } from '@/shared/application/id-generator';
import type { Logger } from '@/shared/application/logging';
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
  readonly translator: MessageTranslator;
  readonly clock: Clock;
  readonly organizationUnitOfWork: UnitOfWork<OrganizationWriteScope>;
  readonly memberUnitOfWork: UnitOfWork<MemberWriteScope>;
  readonly memberDetailsReader: MemberDetailsReader;
  readonly organizationRegistrationFacts: OrganizationRegistrationFactsReader;
  readonly ministryUnitOfWork: UnitOfWork<MinistryWriteScope>;
  readonly ministryCreationFacts: MinistryCreationFactsReader;
  readonly eventRelayLifecycle: EventRelayLifecycle;
  readonly organizationIdGenerator: IdGenerator<OrganizationId>;
  readonly memberIdGenerator: IdGenerator<MemberId>;
  readonly ministryIdGenerator: IdGenerator<MinistryId>;
  readonly ministryRoleIdGenerator: IdGenerator<MinistryRoleId>;
  readonly domainEventIdGenerator: IdGenerator<DomainEventId>;
  readonly messageIdGenerator: IdGenerator<MessageId>;
  readonly requestIdGenerator: IdGenerator<RequestId>;
  readonly correlationIdGenerator: IdGenerator<CorrelationId>;
  readonly createOrganizationHandler: CreateOrganizationHandler;
  readonly createOrganizationPresenter: CreateOrganizationPresenter;
  readonly registerMemberHandler: RegisterMemberHandler;
  readonly registerMemberPresenter: RegisterMemberPresenter;
  readonly getMemberDetailsHandler: GetMemberDetailsHandler;
  readonly getMemberDetailsPresenter: GetMemberDetailsPresenter;
  readonly createMinistryHandler: CreateMinistryHandler;
  readonly createMinistryPresenter: CreateMinistryPresenter;
  readonly defineMinistryRoleHandler: DefineMinistryRoleHandler;
  readonly defineMinistryRolePresenter: DefineMinistryRolePresenter;
}

export type ApplicationContainer = AwilixContainer<ApplicationCradle>;
