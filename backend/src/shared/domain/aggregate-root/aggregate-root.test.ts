import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createDomainEvent,
  parseDomainEventId,
  type DomainEvent,
  type DomainEventId,
} from '@/shared/domain/domain-event';
import { EntityId } from '@/shared/domain/entity';
import { Instant } from '@/shared/domain/instant';

import {
  AggregateRoot,
  DomainEventAcknowledgementError,
} from '.';

type NameChanged = DomainEvent<
  'test.name_changed',
  Readonly<{ name: string }>
>;

class TestAggregateId extends EntityId<'TestAggregateId'> {
  static create(value: string): TestAggregateId {
    return new TestAggregateId(value);
  }
}

class TestAggregate extends AggregateRoot<
  TestAggregateId,
  { name: string },
  NameChanged
> {
  static create(): TestAggregate {
    return new TestAggregate(
      TestAggregateId.create('aggregate-123'),
      { name: 'initial' },
    );
  }

  changeName(
    name: string,
    eventId: DomainEventId,
    occurredAt: Instant,
  ): boolean {
    if (name.trim().length === 0) {
      return false;
    }

    this.props.name = name;
    this.recordDomainEvent(createDomainEvent({
      eventId,
      name: 'test.name_changed',
      occurredAt,
      payload: { name },
    }));

    return true;
  }
}

function eventMetadata(eventIdInput: string): Readonly<{
  eventId: DomainEventId;
  occurredAt: Instant;
}> {
  const eventId = parseDomainEventId(eventIdInput);
  const occurredAt = Instant.create(
    '2026-07-27T15:00:00.000Z',
  );

  assert.equal(eventId.success, true);
  assert.equal(occurredAt.success, true);

  if (!eventId.success || !occurredAt.success) {
    throw new Error('Invalid deterministic test fixture');
  }

  return {
    eventId: eventId.value,
    occurredAt: occurredAt.value,
  };
}

describe('AggregateRoot', () => {
  it('records events alongside a valid change', () => {
    const aggregate = TestAggregate.create();
    const metadata = eventMetadata('event-1');

    const changed = aggregate.changeName(
      'changed',
      metadata.eventId,
      metadata.occurredAt,
    );

    assert.equal(changed, true);
    assert.equal(aggregate.pendingDomainEvents.length, 1);
    assert.deepEqual(
      aggregate.pendingDomainEvents[0]?.payload,
      { name: 'changed' },
    );
  });

  it('does not record an event when the change fails', () => {
    const aggregate = TestAggregate.create();
    const metadata = eventMetadata('event-1');

    const changed = aggregate.changeName(
      '   ',
      metadata.eventId,
      metadata.occurredAt,
    );

    assert.equal(changed, false);
    assert.deepEqual(aggregate.pendingDomainEvents, []);
  });

  it('exposes an immutable snapshot without revealing the internal collection', () => {
    const aggregate = TestAggregate.create();
    const firstMetadata = eventMetadata('event-1');
    const secondMetadata = eventMetadata('event-2');

    aggregate.changeName(
      'first',
      firstMetadata.eventId,
      firstMetadata.occurredAt,
    );
    const snapshot = aggregate.pendingDomainEvents;
    aggregate.changeName(
      'second',
      secondMetadata.eventId,
      secondMetadata.occurredAt,
    );

    assert.equal(Object.isFrozen(snapshot), true);
    assert.deepEqual(
      snapshot.map((event) => event.eventId),
      [firstMetadata.eventId],
    );
    assert.deepEqual(
      aggregate.pendingDomainEvents.map((event) => event.eventId),
      [firstMetadata.eventId, secondMetadata.eventId],
    );
  });

  it('acknowledges only persisted events and preserves newer events', () => {
    const aggregate = TestAggregate.create();
    const firstMetadata = eventMetadata('event-1');
    const secondMetadata = eventMetadata('event-2');
    const thirdMetadata = eventMetadata('event-3');

    aggregate.changeName(
      'first',
      firstMetadata.eventId,
      firstMetadata.occurredAt,
    );
    aggregate.changeName(
      'second',
      secondMetadata.eventId,
      secondMetadata.occurredAt,
    );
    const persistedEvents = aggregate.pendingDomainEvents;
    aggregate.changeName(
      'third',
      thirdMetadata.eventId,
      thirdMetadata.occurredAt,
    );

    aggregate.acknowledgeDomainEvents(persistedEvents);

    assert.deepEqual(
      aggregate.pendingDomainEvents.map((event) => event.eventId),
      [thirdMetadata.eventId],
    );
  });

  it('rejects out-of-sequence acknowledgement without removing events', () => {
    const aggregate = TestAggregate.create();
    const firstMetadata = eventMetadata('event-1');
    const secondMetadata = eventMetadata('event-2');

    aggregate.changeName(
      'first',
      firstMetadata.eventId,
      firstMetadata.occurredAt,
    );
    const firstEvent = aggregate.pendingDomainEvents[0];
    aggregate.changeName(
      'second',
      secondMetadata.eventId,
      secondMetadata.occurredAt,
    );
    const secondEvent = aggregate.pendingDomainEvents[1];

    assert.ok(firstEvent);
    assert.ok(secondEvent);

    assert.throws(
      () => aggregate.acknowledgeDomainEvents([secondEvent]),
      (error: unknown) => {
        assert.equal(
          error instanceof DomainEventAcknowledgementError,
          true,
        );

        if (!(error instanceof DomainEventAcknowledgementError)) {
          return false;
        }

        assert.equal(
          error.code,
          'aggregate_root.domain_events.acknowledgement_mismatch',
        );
        assert.equal(error.pendingCount, 2);
        assert.equal(error.acknowledgementCount, 1);

        return true;
      },
    );

    assert.deepEqual(
      aggregate.pendingDomainEvents.map((event) => event.eventId),
      [firstMetadata.eventId, secondMetadata.eventId],
    );
  });

  it('starts without events during reconstitution', () => {
    const aggregate = TestAggregate.create();

    assert.deepEqual(aggregate.pendingDomainEvents, []);
  });
});
