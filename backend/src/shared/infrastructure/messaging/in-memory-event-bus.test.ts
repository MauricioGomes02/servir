import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseCorrelationId } from '@/shared/application/context';
import {
  createEventEnvelope,
  parseMessageId,
  type EventEnvelope,
  type EventHandler,
} from '@/shared/application/messaging';
import {
  createDomainEvent,
  parseDomainEventId,
  type DomainEvent,
} from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';

import {
  DuplicateEventSubscriptionError,
  EventDispatchError,
  InMemoryEventBus,
} from '.';

type OrganizationCreated = DomainEvent<
  'organization.created',
  Readonly<{ organizationId: string }>
>;

function envelope(): EventEnvelope<OrganizationCreated> {
  const eventId = parseDomainEventId('event-123');
  const occurredAt = Instant.create(
    '2026-07-27T15:00:00.000Z',
  );
  const messageId = parseMessageId('message-123');
  const correlationId = parseCorrelationId('correlation-123');

  assert.equal(eventId.success, true);
  assert.equal(occurredAt.success, true);
  assert.equal(messageId.success, true);
  assert.equal(correlationId.success, true);

  if (
    !eventId.success
    || !occurredAt.success
    || !messageId.success
    || !correlationId.success
  ) {
    throw new Error('Invalid deterministic test fixture');
  }

  return createEventEnvelope({
    messageId: messageId.value,
    correlationId: correlationId.value,
    event: createDomainEvent({
      eventId: eventId.value,
      name: 'organization.created',
      occurredAt: occurredAt.value,
      payload: {
        organizationId: 'organization-123',
      },
    }),
  });
}

function handler(
  handlerName: string,
  handle: EventHandler<OrganizationCreated>['handle'],
): EventHandler<OrganizationCreated> {
  return {
    handlerName,
    handle,
  };
}

describe('InMemoryEventBus', () => {
  it('entrega o mesmo envelope aos handlers inscritos', async () => {
    const bus = new InMemoryEventBus();
    const message = envelope();
    const received: EventEnvelope<OrganizationCreated>[] = [];

    bus.subscribe<OrganizationCreated>(
      'organization.created',
      handler('audit.organization_created', async (current) => {
        received.push(current);
      }),
    );
    bus.subscribe<OrganizationCreated>(
      'organization.created',
      handler('email.organization_created', async (current) => {
        received.push(current);
      }),
    );

    await bus.publish(message);

    assert.deepEqual(received, [message, message]);
  });

  it('inicia handlers independentemente antes de aguardar conclusao', async () => {
    const bus = new InMemoryEventBus();
    const started: string[] = [];
    let releaseHandlers: (() => void) | undefined;
    const released = new Promise<void>((resolve) => {
      releaseHandlers = resolve;
    });

    bus.subscribe<OrganizationCreated>(
      'organization.created',
      handler('first', async () => {
        started.push('first');
        await released;
      }),
    );
    bus.subscribe<OrganizationCreated>(
      'organization.created',
      handler('second', async () => {
        started.push('second');
        await released;
      }),
    );

    const publishing = bus.publish(envelope());

    await Promise.resolve();
    await Promise.resolve();
    assert.deepEqual(started, ['first', 'second']);

    releaseHandlers?.();
    await publishing;
  });

  it('aguarda todos e agrega falhas sem interromper os demais', async () => {
    const bus = new InMemoryEventBus();
    const handled: string[] = [];
    const auditFailure = new Error('audit unavailable');
    const emailFailure = new Error('email unavailable');

    bus.subscribe<OrganizationCreated>(
      'organization.created',
      handler('audit.organization_created', () => {
        handled.push('audit');
        throw auditFailure;
      }),
    );
    bus.subscribe<OrganizationCreated>(
      'organization.created',
      handler('log.organization_created', async () => {
        handled.push('log');
      }),
    );
    bus.subscribe<OrganizationCreated>(
      'organization.created',
      handler('email.organization_created', async () => {
        handled.push('email');
        throw emailFailure;
      }),
    );

    await assert.rejects(
      bus.publish(envelope()),
      (error: unknown) => {
        assert.equal(error instanceof EventDispatchError, true);

        if (!(error instanceof EventDispatchError)) {
          return false;
        }

        assert.equal(error.code, 'event.dispatch.failed');
        assert.equal(error.eventName, 'organization.created');
        assert.deepEqual(
          error.failures.map((failure) => failure.handlerName),
          [
            'audit.organization_created',
            'email.organization_created',
          ],
        );
        assert.deepEqual(
          error.failures.map((failure) => failure.cause),
          [auditFailure, emailFailure],
        );
        assert.equal(Object.isFrozen(error.failures), true);

        return true;
      },
    );

    assert.deepEqual(handled, ['audit', 'log', 'email']);
  });

  it('conclui com sucesso quando nao existem handlers', async () => {
    const bus = new InMemoryEventBus();

    await bus.publish(envelope());
  });

  it('rejeita subscription duplicada para evento e handler', () => {
    const bus = new InMemoryEventBus();
    const auditHandler = handler(
      'audit.organization_created',
      async () => undefined,
    );

    bus.subscribe<OrganizationCreated>(
      'organization.created',
      auditHandler,
    );

    assert.throws(
      () => bus.subscribe<OrganizationCreated>(
        'organization.created',
        auditHandler,
      ),
      (error: unknown) => {
        assert.equal(
          error instanceof DuplicateEventSubscriptionError,
          true,
        );

        if (!(error instanceof DuplicateEventSubscriptionError)) {
          return false;
        }

        assert.equal(error.code, 'event_subscription.duplicate');

        return true;
      },
    );
  });
});
