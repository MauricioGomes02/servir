import assert from 'node:assert/strict';
import { it } from 'node:test';
import { createApplication } from '@/composition/create-application';
import { createPostgresPersistence } from '@/composition/persistence/create-postgres-persistence';
import { InMemoryLogger } from '@/shared/infrastructure/logging';
import { cleanupOrganizations, requireTestDatabaseUrl } from '@/test-support/postgres-integration';
import { Pool } from 'pg';

const databaseUrl = requireTestDatabaseUrl();

const IDS = Array.from(
  { length: 40 },
  (_, index) => `0198f334-6dc5-7c20-9af1-${(0x91d7e59a0000 + index).toString(16)}`,
);

it('schedules one manual occurrence and rejects the same current instant', async (testContext) => {
  const ids = [...IDS];
  const app = createApplication({
    persistence: createPostgresPersistence(databaseUrl),
    logger: new InMemoryLogger(),
    uuidSource: () => {
      const id = ids.shift();
      if (!id) throw new Error('Deterministic UUID source exhausted');
      return id;
    },
  });
  const inspection = new Pool({ connectionString: databaseUrl });
  await cleanupOrganizations(inspection, [IDS[2]]);
  testContext.after(async () => {
    await cleanupOrganizations(inspection, [IDS[2]]);
    await inspection.end();
  });
  const organization = await app.inject({
    method: 'POST',
    url: '/organizations',
    payload: { name: 'Comunidade Servir' },
  });
  const organizationId = organization.json().id as string;
  const ministry = await app.inject({
    method: 'POST',
    url: `/organizations/${organizationId}/ministries`,
    payload: { name: 'Louvor' },
  });
  const activity = await app.inject({
    method: 'POST',
    url: `/organizations/${organizationId}/activities`,
    payload: { name: 'Culto', ministryIds: [ministry.json().id] },
  });
  const activityId = activity.json().id as string;
  const request = {
    method: 'POST' as const,
    url: `/organizations/${organizationId}/activities/${activityId}/occurrences`,
    payload: {
      date: '2026-08-16',
      time: '19:00',
      timeZoneId: 'America/Sao_Paulo',
    },
  };
  const scheduled = await app.inject(request);
  const duplicate = await app.inject(request);
  await app.close();

  assert.equal(scheduled.statusCode, 201);
  assert.deepEqual(scheduled.json(), {
    id: scheduled.json().id,
    organizationId,
    activityId,
    date: '2026-08-16',
    time: '19:00',
    timeZoneId: 'America/Sao_Paulo',
    resolvedOffset: '-03:00',
    scheduledAt: '2026-08-16T22:00:00.000Z',
    origin: 'manual',
    revision: 1,
    status: 'scheduled',
  });
  assert.equal(duplicate.statusCode, 409);
});
