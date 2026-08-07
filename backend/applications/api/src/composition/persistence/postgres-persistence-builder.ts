import type { EventOutbox } from '@/shared/application/messaging';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { PostgresEventOutbox } from '@/shared/infrastructure/messaging';
import { captureActiveTraceContext } from '@/shared/infrastructure/telemetry';
import { PostgresUnitOfWork } from '@/shared/infrastructure/unit-of-work';
import type { Pool, PoolClient } from 'pg';
import type { ServiceToken } from '../services';
import { ServiceRegistry } from '../services';
import { IntegrationEventMapperRegistry } from './integration-event-mapper-registry';

export class PostgresPersistenceBuilder {
  readonly services = new ServiceRegistry();
  readonly integrationEvents = new IntegrationEventMapperRegistry();

  constructor(private readonly pool: Pool) {}

  addValue<T>(token: ServiceToken<T>, factory: (pool: Pool) => T): void {
    this.services.add(token, factory(this.pool));
  }

  addWriteScope<TScope extends { readonly outbox: EventOutbox }>(
    token: ServiceToken<UnitOfWork<TScope>>,
    factory: (client: PoolClient) => Omit<TScope, 'outbox'>,
  ): void {
    const mapper = this.integrationEvents.map;
    this.services.add(
      token,
      new PostgresUnitOfWork(
        this.pool,
        (client) =>
          ({
            ...factory(client),
            outbox: new PostgresEventOutbox(client, mapper, captureActiveTraceContext),
          }) as unknown as TScope,
      ),
    );
  }
}
