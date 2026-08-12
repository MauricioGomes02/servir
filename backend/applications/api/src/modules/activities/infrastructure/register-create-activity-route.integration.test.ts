import assert from 'node:assert/strict';
import { it } from 'node:test';
import { createApplication } from '@/composition/create-application';
import { createPostgresPersistence } from '@/composition/create-postgres-persistence';
import { InMemoryLogger } from '@/shared/infrastructure/logging';
import { cleanupOrganizations, requireTestDatabaseUrl } from '@/test-support/postgres-integration';
import { Pool } from 'pg';

const databaseUrl = requireTestDatabaseUrl();

const IDS = Array.from(
  { length: 15 },
  (_, index) => `0198f334-6dc5-7c20-9af1-${(0x91d7e599d000 + index).toString(16)}`,
);

it('creates an activity through its organization resource', async (testContext) => {
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
  const ministryId = ministry.json().id as string;
  const activity = await app.inject({
    method: 'POST',
    url: `/organizations/${organizationId}/activities`,
    payload: { name: 'Culto de domingo', ministryIds: [ministryId] },
  });
  await app.close();

  assert.equal(activity.statusCode, 201);
  assert.deepEqual(activity.json(), {
    id: IDS[12],
    organizationId,
    name: 'Culto de domingo',
    ministryIds: [ministryId],
    status: 'active',
  });
  assert.equal(activity.headers.location, `/organizations/${organizationId}/activities/${IDS[12]}`);
});
