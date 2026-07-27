import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseCorrelationId } from '@/shared/application/context';
import { parseMessageId } from '@/shared/application/messaging';
import { Instant } from '@/shared/domain/instant';

import {
  createLogRecord,
  LogLevels,
  type LogAttributeValue,
} from '.';

function isLogAttributeObject(
  value: LogAttributeValue,
): value is { readonly [key: string]: LogAttributeValue } {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value);
}

describe('LogRecord', () => {
  it('preserva somente contexto e atributos fornecidos', () => {
    const correlationId = parseCorrelationId('correlation-123');
    const messageId = parseMessageId('message-123');
    const occurredAt = Instant.create(
      '2026-07-27T15:00:00.000Z',
    );

    assert.equal(correlationId.success, true);
    assert.equal(messageId.success, true);
    assert.equal(occurredAt.success, true);

    if (
      !correlationId.success
      || !messageId.success
      || !occurredAt.success
    ) {
      return;
    }

    const record = createLogRecord({
      level: LogLevels.Info,
      eventName: 'organization.created',
      occurredAt: occurredAt.value,
      context: {
        correlationId: correlationId.value,
        messageId: messageId.value,
      },
      attributes: {
        'organization.id': 'organization-123',
      },
    });

    assert.deepEqual(record.context, {
      correlationId: 'correlation-123',
      messageId: 'message-123',
    });
    assert.deepEqual(record.attributes, {
      'organization.id': 'organization-123',
    });
    assert.equal(record.occurredAt, occurredAt.value);
  });

  it('cria copia profundamente imutavel sem congelar a origem', () => {
    const attributes = {
      change: {
        fields: ['name'],
      },
    };

    const record = createLogRecord({
      level: LogLevels.Debug,
      eventName: 'organization.change_observed',
      attributes,
    });

    assert.equal(Object.isFrozen(record), true);
    assert.equal(Object.isFrozen(record.attributes), true);
    assert.equal(Object.isFrozen(record.attributes.change), true);

    const change = record.attributes.change;
    assert.equal(Array.isArray(change), false);

    if (!isLogAttributeObject(change)) {
      return;
    }

    assert.equal(Object.isFrozen(change.fields), true);
    assert.equal(Object.isFrozen(attributes), false);
    assert.equal(Object.isFrozen(attributes.change), false);
    assert.equal(Object.isFrozen(attributes.change.fields), false);
  });
});
