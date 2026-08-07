import type { OrganizationWriteScope } from '@/modules/organizations/application';
import type {
  MinistryCreationFactsReader,
  MinistryMembershipRequestFactsReader,
  MinistryMembershipWriteScope,
  MinistryWriteScope,
} from '@/modules/ministries/application';
import {
  isMinistryCreated,
  isMinistryMembershipRequested,
  isMinistryRoleDefined,
} from '@/modules/ministries/domain';
import {
  mapMinistryCreatedIntegrationEvent,
  mapMinistryRoleDefinedIntegrationEvent,
  mapMinistryMembershipRequestedIntegrationEvent,
  PostgresMinistryMembershipRepository,
  PostgresMinistryMembershipRequestFactsReader,
  PostgresMinistryCreationFactsReader,
  PostgresMinistryRepository,
} from '@/modules/ministries/infrastructure';
import {
  mapOrganizationCreatedIntegrationEvent,
  PostgresOrganizationRepository,
} from '@/modules/organizations/infrastructure';
import { isOrganizationCreated } from '@/modules/organizations/domain';
import type {
  MemberWriteScope,
  MemberDetailsReader,
  OrganizationRegistrationFactsReader,
} from '@/modules/membership/application';
import { isMemberRegistered } from '@/modules/membership/domain';
import {
  mapMemberRegisteredIntegrationEvent,
  PostgresMemberRepository,
  PostgresMemberDetailsReader,
  PostgresOrganizationRegistrationFactsReader,
} from '@/modules/membership/infrastructure';
import type { EventEnvelope } from '@/shared/application/messaging';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { PostgresEventOutbox, UnmappedDomainEventError } from '@/shared/infrastructure/messaging';
import { captureActiveTraceContext } from '@/shared/infrastructure/telemetry';
import { PostgresUnitOfWork } from '@/shared/infrastructure/unit-of-work';
import { Pool } from 'pg';

export interface PostgresPersistence {
  readonly unitOfWork: UnitOfWork<OrganizationWriteScope>;
  readonly memberUnitOfWork: UnitOfWork<MemberWriteScope>;
  readonly ministryUnitOfWork: UnitOfWork<MinistryWriteScope>;
  readonly ministryMembershipUnitOfWork: UnitOfWork<MinistryMembershipWriteScope>;
  readonly memberDetailsReader: MemberDetailsReader;
  readonly organizationRegistrationFacts: OrganizationRegistrationFactsReader;
  readonly ministryCreationFacts: MinistryCreationFactsReader;
  readonly ministryMembershipRequestFacts: MinistryMembershipRequestFactsReader;
  close(): Promise<void>;
}

export function createPostgresPersistence(connectionString: string): PostgresPersistence {
  const pool = new Pool({ connectionString });

  function mapIntegrationEvent(envelope: EventEnvelope) {
    if (isOrganizationCreated(envelope.event)) {
      return mapOrganizationCreatedIntegrationEvent(envelope.event);
    }

    if (isMemberRegistered(envelope.event)) {
      return mapMemberRegisteredIntegrationEvent(envelope.event);
    }

    if (isMinistryCreated(envelope.event)) {
      return mapMinistryCreatedIntegrationEvent(envelope.event);
    }
    if (isMinistryRoleDefined(envelope.event)) {
      return mapMinistryRoleDefinedIntegrationEvent(envelope.event);
    }
    if (isMinistryMembershipRequested(envelope.event)) {
      return mapMinistryMembershipRequestedIntegrationEvent(envelope.event);
    }

    throw new UnmappedDomainEventError(envelope.event.name);
  }

  return {
    unitOfWork: new PostgresUnitOfWork(pool, (client) => ({
      organizations: new PostgresOrganizationRepository(client),
      outbox: new PostgresEventOutbox(client, mapIntegrationEvent, captureActiveTraceContext),
    })),
    memberUnitOfWork: new PostgresUnitOfWork(pool, (client) => ({
      members: new PostgresMemberRepository(client),
      outbox: new PostgresEventOutbox(client, mapIntegrationEvent, captureActiveTraceContext),
    })),
    ministryUnitOfWork: new PostgresUnitOfWork(pool, (client) => ({
      ministries: new PostgresMinistryRepository(client),
      outbox: new PostgresEventOutbox(client, mapIntegrationEvent, captureActiveTraceContext),
    })),
    ministryMembershipUnitOfWork: new PostgresUnitOfWork(pool, (client) => ({
      ministryMemberships: new PostgresMinistryMembershipRepository(client),
      outbox: new PostgresEventOutbox(client, mapIntegrationEvent, captureActiveTraceContext),
    })),
    memberDetailsReader: new PostgresMemberDetailsReader(pool),
    organizationRegistrationFacts: new PostgresOrganizationRegistrationFactsReader(pool),
    ministryCreationFacts: new PostgresMinistryCreationFactsReader(pool),
    ministryMembershipRequestFacts: new PostgresMinistryMembershipRequestFactsReader(pool),
    async close(): Promise<void> {
      await pool.end();
    },
  };
}
