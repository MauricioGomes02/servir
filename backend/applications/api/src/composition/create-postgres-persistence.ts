import type { OrganizationWriteScope } from '@/modules/organizations/application';
import {
  mapOrganizationCreatedIntegrationEvent,
  PostgresOrganizationRepository,
} from '@/modules/organizations/infrastructure';
import { isOrganizationCreated } from '@/modules/organizations/domain';
import type { EventEnvelope } from '@/shared/application/messaging';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import {
  PostgresEventOutbox,
  UnmappedDomainEventError,
} from '@/shared/infrastructure/messaging';
import { captureActiveTraceContext } from '@/shared/infrastructure/telemetry';
import { PostgresUnitOfWork } from '@/shared/infrastructure/unit-of-work';
import { Pool } from 'pg';

export interface PostgresPersistence {
  readonly unitOfWork: UnitOfWork<OrganizationWriteScope>;
  close(): Promise<void>;
}

export function createPostgresPersistence(
  connectionString: string,
): PostgresPersistence {
  const pool = new Pool({ connectionString });

  function mapIntegrationEvent(envelope: EventEnvelope) {
    if (isOrganizationCreated(envelope.event)) {
      return mapOrganizationCreatedIntegrationEvent(envelope.event);
    }

    throw new UnmappedDomainEventError(envelope.event.name);
  }

  return {
    unitOfWork: new PostgresUnitOfWork(pool, (client) => ({
      organizations: new PostgresOrganizationRepository(client),
      outbox: new PostgresEventOutbox(
        client,
        mapIntegrationEvent,
        captureActiveTraceContext,
      ),
    })),
    async close(): Promise<void> {
      await pool.end();
    },
  };
}
