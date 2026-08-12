import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MinistryId } from '@/modules/ministries/domain';
import { OrganizationId } from '@/modules/organizations/domain';
import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import { parseMessageId, type EventEnvelope } from '@/shared/application/messaging';
import { success } from '@/shared/core/result';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { FixedClock } from '@/shared/infrastructure/clock';
import { SequenceIdGenerator } from '@/shared/infrastructure/id-generator';

import { ActivityCreationPolicy, ActivityId, type Activity } from '../domain';
import { CreateActivityHandler } from './create-activity';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid deterministic fixture');
  return result.value;
}

describe('CreateActivityHandler', () => {
  it('persists the activity and outbox in the same scope', async () => {
    const organizationId = value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599b001'));
    const ministryId = value(MinistryId.create('0198f334-6dc5-7c20-9af1-91d7e599b002'));
    const activities: Activity[] = [];
    const envelopes: EventEnvelope[] = [];
    const scope = {
      activities: {
        async add(activity: Activity) {
          activities.push(activity);
          return success();
        },
      },
      outbox: {
        async add(received: readonly EventEnvelope[]) {
          envelopes.push(...received);
        },
      },
    };
    const handler = new CreateActivityHandler({
      clock: new FixedClock(value(Instant.create('2026-08-11T12:00:00.000Z'))),
      activityIdGenerator: new SequenceIdGenerator([
        value(ActivityId.create('0198f334-6dc5-7c20-9af1-91d7e599b003')),
      ]),
      domainEventIdGenerator: new SequenceIdGenerator([
        value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599b004')),
      ]),
      messageIdGenerator: new SequenceIdGenerator([
        value(parseMessageId('0198f334-6dc5-7c20-9af1-91d7e599b005')),
      ]),
      facts: {
        async find() {
          return {
            organizationExists: true,
            activeNameExists: false,
            activeMinistryIds: new Set([ministryId.toString()]),
          };
        },
      },
      policy: new ActivityCreationPolicy(),
      unitOfWork: {
        async execute(work) {
          return work(scope);
        },
      },
    });

    const result = await handler.handle(
      {
        organizationId: organizationId.toString(),
        name: 'Culto de domingo',
        ministryIds: [ministryId.toString()],
      },
      createExecutionContext({
        correlationId: value(parseCorrelationId('activity-creation-test')),
      }),
    );

    assert.equal(result.success, true);
    assert.equal(activities.length, 1);
    assert.equal(envelopes.length, 1);
    assert.equal(envelopes[0]?.event.name, 'activity.created');
    assert.deepEqual(activities[0]?.pendingDomainEvents, []);
  });

  it('reports every malformed independent input before reading facts', async () => {
    let reads = 0;
    const handler = new CreateActivityHandler({
      clock: new FixedClock(value(Instant.create('2026-08-11T12:00:00.000Z'))),
      activityIdGenerator: new SequenceIdGenerator([]),
      domainEventIdGenerator: new SequenceIdGenerator([]),
      messageIdGenerator: new SequenceIdGenerator([]),
      facts: {
        async find() {
          reads += 1;
          throw new Error('unexpected');
        },
      },
      policy: new ActivityCreationPolicy(),
      unitOfWork: {
        async execute(work) {
          return work({
            activities: {
              async add() {
                return success();
              },
            },
            outbox: { async add() {} },
          });
        },
      },
    });
    const result = await handler.handle(
      { organizationId: 'invalid', name: '', ministryIds: ['invalid', 'also-invalid'] },
      createExecutionContext({ correlationId: value(parseCorrelationId('validation-test')) }),
    );
    assert.equal(result.success, false);
    if (!result.success && 'errors' in result.error) assert.equal(result.error.errors.length, 4);
    assert.equal(reads, 0);
  });
});
