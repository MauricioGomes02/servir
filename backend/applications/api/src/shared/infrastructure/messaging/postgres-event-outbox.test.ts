import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PoolClient } from 'pg';

import { parseCorrelationId } from '@/shared/application/context';
import {
  createEventEnvelope,
  parseMessageId,
  type IntegrationEventMapper,
} from '@/shared/application/messaging';
import {
  createDomainEvent,
  parseDomainEventId,
} from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';

import { PostgresEventOutbox } from './postgres-event-outbox';
import { PostgresEventOutboxError } from './postgres-event-outbox-error';
import { UnmappedDomainEventError } from './unmapped-domain-event-error';

function requireValue<TValue>(
  result: Readonly<
    | { success: true; value: TValue }
    | { success: false }
  >,
): TValue {
  assert.equal(result.success, true);

  if (!result.success) {
    throw new Error('Invalid deterministic outbox fixture');
  }

  return result.value;
}

function envelope() {
  const occurredAt = requireValue(
    Instant.create('2026-07-29T15:00:00.000Z'),
  );
  const event = createDomainEvent({
    eventId: requireValue(parseDomainEventId(
      '0198f334-6dc5-7c20-9af1-91d7e599f001',
    )),
    name: 'organization.created',
    occurredAt,
    payload: {
      organizationId: '0198f334-6dc5-7c20-9af1-91d7e599f002',
      internalField: 'not-public',
    },
  });

  return createEventEnvelope({
    messageId: requireValue(parseMessageId(
      '0198f334-6dc5-7c20-9af1-91d7e599f003',
    )),
    event,
    correlationId: requireValue(parseCorrelationId('correlation-123')),
  });
}

function createClient() {
  const queries: Array<Readonly<{
    text: string;
    values: readonly unknown[];
  }>> = [];
  const client = {
    async query(text: string, values: readonly unknown[]) {
      queries.push({ text, values });
      return {};
    },
  } as unknown as PoolClient;

  return { client, queries };
}

describe('PostgresEventOutbox', () => {
  it('persists only the mapped versioned integration contract', async () => {
    const fixture = createClient();
    const integrationEventMapper: IntegrationEventMapper = (received) => ({
      channel: 'servir.organizations.events',
      source: 'urn:servir:organizations',
      type: 'servir.organizations.organization.created.v1',
      name: 'organization.created',
      version: 1,
      occurredAt: received.event.occurredAt.toISOString(),
      aggregateId: received.event.payload.organizationId as string,
      partitionKey: received.event.payload.organizationId as string,
      payload: {
        organizationId: received.event.payload.organizationId,
      },
      metadata: {},
    });
    const outbox = new PostgresEventOutbox(
      fixture.client,
      integrationEventMapper,
      () => ({
        traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
        tracestate: 'vendor=value',
      }),
    );

    await outbox.add([envelope()]);

    assert.equal(fixture.queries.length, 1);
    assert.deepEqual(fixture.queries[0]?.values.slice(6), [
      {
        organizationId: '0198f334-6dc5-7c20-9af1-91d7e599f002',
      },
      1,
      '0198f334-6dc5-7c20-9af1-91d7e599f002',
      '0198f334-6dc5-7c20-9af1-91d7e599f002',
      {
        event: {},
        trace: {
          traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
          tracestate: 'vendor=value',
        },
      },
      'servir.organizations.events',
      'urn:servir:organizations',
      'servir.organizations.organization.created.v1',
    ]);
    assert.equal(
      JSON.stringify(fixture.queries[0]?.values).includes('not-public'),
      false,
    );
  });

  it('classifies an unmapped event without attempting persistence', async () => {
    const fixture = createClient();
    const mappingFailure = new UnmappedDomainEventError(
      'organization.created',
    );
    const outbox = new PostgresEventOutbox(fixture.client, () => {
      throw mappingFailure;
    });

    await assert.rejects(
      outbox.add([envelope()]),
      (error: unknown) => error instanceof PostgresEventOutboxError
        && error.cause === mappingFailure,
    );
    assert.deepEqual(fixture.queries, []);
  });
});
