import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CreateActivityHandler } from '@/modules/activities/application';
import { OrganizationId } from '@/modules/organizations/domain';
import { ActivityCreationPolicy, ActivityId } from '@/modules/activities/domain';
import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import { parseMessageId } from '@/shared/application/messaging';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { FixedClock } from '@/shared/infrastructure/clock';
import { SequenceIdGenerator } from '@/shared/infrastructure/id-generator';
import { PostgresEventOutboxError } from '@/shared/infrastructure/messaging';
import { Pool } from 'pg';
import { requireTestDatabaseUrl } from '@/test-support/postgres-integration';

import { createPostgresPersistence } from './persistence/create-postgres-persistence';
import {
  activityCreationFacts,
  activityDetailsReader,
  activityListReader,
  activityUnitOfWork,
} from './persistence/activities-persistence-module';

const databaseUrl = requireTestDatabaseUrl();
const ORGANIZATION_ID = '0198f334-6dc5-7c20-9af1-91d7e599d100';
const MINISTRY_ID = '0198f334-6dc5-7c20-9af1-91d7e599d101';
const ACTIVITY_ID = '0198f334-6dc5-7c20-9af1-91d7e599d102';
const ROLLED_BACK_ACTIVITY_ID = '0198f334-6dc5-7c20-9af1-91d7e599d103';
const MESSAGE_ID = '0198f334-6dc5-7c20-9af1-91d7e599d104';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid deterministic integration fixture');
  return result.value;
}

describe('PostgreSQL activity persistence', () => {
  it('commits activity, participants and outbox atomically', async (testContext) => {
    const inspection = new Pool({ connectionString: databaseUrl });
    const persistence = createPostgresPersistence(databaseUrl);
    async function cleanup() {
      await inspection.query('DELETE FROM outbox_messages WHERE message_id = $1', [MESSAGE_ID]);
      await inspection.query(
        'DELETE FROM activity_ministries WHERE activity_id = ANY($1::uuid[])',
        [[ACTIVITY_ID, ROLLED_BACK_ACTIVITY_ID]],
      );
      await inspection.query('DELETE FROM activities WHERE id = ANY($1::uuid[])', [
        [ACTIVITY_ID, ROLLED_BACK_ACTIVITY_ID],
      ]);
      await inspection.query('DELETE FROM ministries WHERE id = $1', [MINISTRY_ID]);
      await inspection.query('DELETE FROM organizations WHERE id = $1', [ORGANIZATION_ID]);
    }
    await cleanup();
    await inspection.query('INSERT INTO organizations (id, name) VALUES ($1, $2)', [
      ORGANIZATION_ID,
      'Activity integration organization',
    ]);
    await inspection.query(
      'INSERT INTO ministries (id, organization_id, name, status) VALUES ($1, $2, $3, 1)',
      [MINISTRY_ID, ORGANIZATION_ID, 'Louvor'],
    );
    testContext.after(async () => {
      await cleanup();
      await persistence.close();
      await inspection.end();
    });

    const common = {
      clock: new FixedClock(value(Instant.create('2026-08-11T12:00:00.000Z'))),
      facts: persistence.services.get(activityCreationFacts),
      policy: new ActivityCreationPolicy(),
      unitOfWork: persistence.services.get(activityUnitOfWork),
    };
    const command = {
      organizationId: ORGANIZATION_ID,
      name: 'Culto de domingo',
      ministryIds: [MINISTRY_ID],
    };
    const context = createExecutionContext({
      correlationId: value(parseCorrelationId('activity-postgres-integration')),
    });
    const committed = new CreateActivityHandler({
      ...common,
      activityIdGenerator: new SequenceIdGenerator([value(ActivityId.create(ACTIVITY_ID))]),
      domainEventIdGenerator: new SequenceIdGenerator([
        value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599d105')),
      ]),
      messageIdGenerator: new SequenceIdGenerator([value(parseMessageId(MESSAGE_ID))]),
    });
    assert.equal((await committed.handle(command, context)).success, true);
    const persisted = await inspection.query(
      `SELECT a.status, am.ministry_id, o.event_type
       FROM activities a
       JOIN activity_ministries am ON am.activity_id = a.id
       JOIN outbox_messages o ON o.aggregate_id = a.id
       WHERE a.id = $1`,
      [ACTIVITY_ID],
    );
    assert.equal(persisted.rowCount, 1);
    assert.equal(persisted.rows[0]?.status, 1);
    assert.equal(persisted.rows[0]?.ministry_id, MINISTRY_ID);
    assert.equal(persisted.rows[0]?.event_type, 'servir.activities.activity.created.v1');

    const organizationId = value(OrganizationId.create(ORGANIZATION_ID));
    const activityId = value(ActivityId.create(ACTIVITY_ID));
    const page = await persistence.services.get(activityListReader).list({
      organizationId,
      page: 1,
      pageSize: 20,
      search: 'Culto',
      status: 'active',
    });
    assert.equal(page?.pagination.totalItems, 1);
    assert.equal(page?.items[0]?.ministryCount, 1);
    const details = await persistence.services
      .get(activityDetailsReader)
      .find(organizationId, activityId);
    assert.equal(details?.name, 'Culto de domingo');
    assert.deepEqual(details?.ministries, [{ id: MINISTRY_ID, name: 'Louvor' }]);

    const failing = new CreateActivityHandler({
      ...common,
      activityIdGenerator: new SequenceIdGenerator([
        value(ActivityId.create(ROLLED_BACK_ACTIVITY_ID)),
      ]),
      domainEventIdGenerator: new SequenceIdGenerator([
        value(parseDomainEventId('0198f334-6dc5-7c20-9af1-91d7e599d106')),
      ]),
      messageIdGenerator: new SequenceIdGenerator([value(parseMessageId(MESSAGE_ID))]),
    });
    await assert.rejects(
      failing.handle({ ...command, name: 'Culto da noite' }, context),
      (error: unknown) => error instanceof PostgresEventOutboxError,
    );
    assert.equal(
      (await inspection.query('SELECT 1 FROM activities WHERE id = $1', [ROLLED_BACK_ACTIVITY_ID]))
        .rowCount,
      0,
    );
  });
});
