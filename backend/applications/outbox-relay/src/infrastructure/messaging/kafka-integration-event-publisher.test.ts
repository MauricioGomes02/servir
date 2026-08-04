import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  IntegrationEventPublicationError,
} from '@/application';
import type { ClaimedOutboxMessage } from '@/application';

import {
  KafkaIntegrationEventPublisher,
  KafkaPublicationErrorCodes,
  type KafkaProducer,
} from './kafka-integration-event-publisher';

function message(): ClaimedOutboxMessage {
  return {
    messageId: '0198f334-6dc5-7c20-9af1-91d7e599c001',
    eventId: '0198f334-6dc5-7c20-9af1-91d7e599c002',
    correlationId: 'correlation-123',
    causationId: '0198f334-6dc5-7c20-9af1-91d7e599c003',
    traceContext: {
      traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
      tracestate: 'vendor=value',
    },
    event: {
      channel: 'servir.organizations.events',
      source: 'urn:servir:organizations',
      type: 'servir.organizations.organization.created.v1',
      name: 'organization.created',
      version: 1,
      occurredAt: '2026-07-31T15:00:00.000Z',
      aggregateId: '0198f334-6dc5-7c20-9af1-91d7e599c004',
      partitionKey: '0198f334-6dc5-7c20-9af1-91d7e599c004',
      payload: {
        organizationId: '0198f334-6dc5-7c20-9af1-91d7e599c004',
        name: 'Servir',
      },
      metadata: {},
    },
    attemptCount: 1,
    leaseId: '0198f334-6dc5-7c20-9af1-91d7e599c005',
    leaseExpiresAt: '2026-07-31T15:01:00.000Z',
  };
}

function publisher(producer: KafkaProducer) {
  return new KafkaIntegrationEventPublisher({
    producer,
    timeoutMs: 10_000,
  });
}

describe('KafkaIntegrationEventPublisher', () => {
  it('publishes a structured CloudEvent with partitioning and trace headers', async () => {
    const records: unknown[] = [];
    const producer: KafkaProducer = {
      async send(record) {
        records.push(record);
      },
    };

    await publisher(producer).publish(message());

    assert.equal(records.length, 1);
    const record = records[0] as {
      topic: string;
      acks: number;
      messages: Array<{
        key: string;
        value: string;
        headers: Record<string, string>;
      }>;
    };
    const kafkaMessage = record.messages[0];
    const cloudEvent = JSON.parse(kafkaMessage?.value ?? '{}');

    assert.equal(record.topic, 'servir.organizations.events');
    assert.equal(record.acks, -1);
    assert.equal(
      kafkaMessage?.key,
      '0198f334-6dc5-7c20-9af1-91d7e599c004',
    );
    assert.deepEqual(kafkaMessage?.headers, {
      'content-type': 'application/cloudevents+json',
      traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
      tracestate: 'vendor=value',
    });
    assert.deepEqual(cloudEvent, {
      specversion: '1.0',
      id: '0198f334-6dc5-7c20-9af1-91d7e599c001',
      source: 'urn:servir:organizations',
      type: 'servir.organizations.organization.created.v1',
      subject: '0198f334-6dc5-7c20-9af1-91d7e599c004',
      time: '2026-07-31T15:00:00.000Z',
      datacontenttype: 'application/json',
      correlationid: 'correlation-123',
      causationid: '0198f334-6dc5-7c20-9af1-91d7e599c003',
      data: {
        organizationId: '0198f334-6dc5-7c20-9af1-91d7e599c004',
        name: 'Servir',
      },
    });
    assert.equal('eventId' in cloudEvent, false);
    assert.equal('timestamp' in (kafkaMessage ?? {}), false);
  });

  it('routes each message through its persisted channel and identity', async () => {
    const records: Array<{ topic: string; messages: Array<{ value: string }> }> = [];
    const producer: KafkaProducer = {
      async send(record) {
        records.push(record);
      },
    };
    const organizationMessage = message();
    const membershipMessage: ClaimedOutboxMessage = {
      ...organizationMessage,
      event: {
        ...organizationMessage.event,
        channel: 'servir.membership.events',
        source: 'urn:servir:membership',
        type: 'servir.membership.member.registered.v1',
        name: 'member.registered',
      },
    };

    await publisher(producer).publish(membershipMessage);

    assert.equal(records[0]?.topic, 'servir.membership.events');
    const cloudEvent = JSON.parse(records[0]?.messages[0]?.value ?? '{}');
    assert.equal(cloudEvent.source, 'urn:servir:membership');
    assert.equal(cloudEvent.type, 'servir.membership.member.registered.v1');
  });

  it('classifies explicit non-retryable Kafka failures by stable code', async () => {
    const producer: KafkaProducer = {
      async send() {
        throw Object.assign(new Error('unstable SDK message'), {
          retriable: false,
        });
      },
    };

    await assert.rejects(
      publisher(producer).publish(message()),
      (error: unknown) => error instanceof IntegrationEventPublicationError
        && error.code === KafkaPublicationErrorCodes.PublishRejected
        && error.retryable === false,
    );
  });

  it('treats unknown publication failures as retryable', async () => {
    const producer: KafkaProducer = {
      async send() {
        throw new Error('unknown failure');
      },
    };

    await assert.rejects(
      publisher(producer).publish(message()),
      (error: unknown) => error instanceof IntegrationEventPublicationError
        && error.code === KafkaPublicationErrorCodes.PublishFailed
        && error.retryable === true,
    );
  });

  it('rejects every invalid timeout boundary with a stable code', () => {
    const producer: KafkaProducer = { async send() {} };

    for (const timeoutMs of [0, -1, 1.5]) {
      assert.throws(
        () => new KafkaIntegrationEventPublisher({
          producer,
          timeoutMs,
        }),
        (error: unknown) => error instanceof IntegrationEventPublicationError
          && error.code === KafkaPublicationErrorCodes.InvalidConfiguration,
      );
    }
  });
});
