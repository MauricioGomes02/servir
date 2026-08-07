import assert from 'node:assert/strict';
import { it } from 'node:test';
import { createEventEnvelope, parseMessageId } from '@/shared/application/messaging';
import { parseCorrelationId } from '@/shared/application/context';
import {
  createDomainEvent,
  parseDomainEventId,
  type DomainEvent,
} from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import {
  DuplicateIntegrationEventMapperError,
  IntegrationEventMapperRegistry,
} from './integration-event-mapper-registry';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('fixture');
  return result.value;
}

it('maps an event by name and rejects duplicate mapper registration', () => {
  type TestOccurred = DomainEvent<'test.occurred', Readonly<{ id: string }>>;
  const registry = new IntegrationEventMapperRegistry();
  const mapper = (event: TestOccurred) => ({
    channel: 'test.events',
    source: 'urn:test',
    type: 'test.occurred.v1',
    name: 'test.occurred' as const,
    version: 1 as const,
    occurredAt: event.occurredAt.toISOString(),
    aggregateId: event.payload.id,
    partitionKey: event.payload.id,
    payload: event.payload,
    metadata: Object.freeze({}),
  });
  registry.register<TestOccurred>('test.occurred', mapper);
  assert.throws(
    () => registry.register<TestOccurred>('test.occurred', mapper),
    DuplicateIntegrationEventMapperError,
  );
  const event = createDomainEvent({
    eventId: value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599f101')),
    name: 'test.occurred',
    occurredAt: value(Instant.create('2026-08-07T12:00:00.000Z')),
    payload: { id: 'aggregate-1' },
  });
  const envelope = createEventEnvelope({
    messageId: value(parseMessageId('0198f334-6dc5-7c20-9af1-91d7e599f102')),
    correlationId: value(parseCorrelationId('correlation-123')),
    event,
  });
  assert.equal(registry.map(envelope).aggregateId, 'aggregate-1');
});
