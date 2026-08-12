import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import { parseMessageId, type EventEnvelope } from '@/shared/application/messaging';
import { success } from '@/shared/core/result';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { FixedClock } from '@/shared/infrastructure/clock';
import { SequenceIdGenerator } from '@/shared/infrastructure/id-generator';
import {
  AvailabilityRequestId,
  AvailabilityRequestOpeningPolicy,
  type AvailabilityRequest,
} from '../domain';
import { OpenAvailabilityRequestHandler } from './open-availability-request';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid deterministic fixture');
  return result.value;
}

function handler(input: {
  requests: AvailabilityRequest[];
  envelopes: EventEnvelope[];
  reads: { value: number };
}) {
  return new OpenAvailabilityRequestHandler({
    clock: new FixedClock(value(Instant.create('2026-08-11T12:00:00.000Z'))),
    availabilityRequestIdGenerator: new SequenceIdGenerator([
      value(AvailabilityRequestId.create('0198f334-6dc5-7c20-9af1-91d7e59b0011')),
    ]),
    domainEventIdGenerator: new SequenceIdGenerator([
      value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e59b0012')),
    ]),
    messageIdGenerator: new SequenceIdGenerator([
      value(parseMessageId('0198f334-6dc5-7c20-9af1-91d7e59b0013')),
    ]),
    facts: {
      async find() {
        input.reads.value += 1;
        return { teamActive: true };
      },
    },
    policy: new AvailabilityRequestOpeningPolicy(),
    unitOfWork: {
      async execute(work) {
        return work({
          availabilityRequests: {
            async add(request) {
              input.requests.push(request);
              return success();
            },
          },
          outbox: {
            async add(received) {
              input.envelopes.push(...received);
            },
          },
        });
      },
    },
  });
}

describe('OpenAvailabilityRequestHandler', () => {
  it('persists the request and outbox in the same scope', async () => {
    const requests: AvailabilityRequest[] = [];
    const envelopes: EventEnvelope[] = [];
    const reads = { value: 0 };
    const result = await handler({ requests, envelopes, reads }).handle(
      {
        organizationId: '0198f334-6dc5-7c20-9af1-91d7e59b0021',
        ministryTeamId: '0198f334-6dc5-7c20-9af1-91d7e59b0022',
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        respondBy: '2026-08-25T23:59:59.000Z',
      },
      createExecutionContext({
        correlationId: value(parseCorrelationId('availability-opening-test')),
      }),
    );

    assert.equal(result.success, true);
    assert.equal(requests.length, 1);
    assert.equal(envelopes[0]?.event.name, 'availability_request.opened');
    assert.deepEqual(requests[0]?.pendingDomainEvents, []);
  });

  it('reports every malformed independent input before reading facts', async () => {
    const reads = { value: 0 };
    const result = await handler({ requests: [], envelopes: [], reads }).handle(
      {
        organizationId: 'invalid',
        ministryTeamId: 'invalid',
        startDate: 'invalid',
        endDate: 1,
        respondBy: 'invalid',
      },
      createExecutionContext({
        correlationId: value(parseCorrelationId('availability-validation-test')),
      }),
    );

    assert.equal(result.success, false);
    if (!result.success && 'errors' in result.error) assert.equal(result.error.errors.length, 5);
    assert.equal(reads.value, 0);
  });
});
