import assert from 'node:assert/strict';
import { it } from 'node:test';
import { createApplication } from '@/composition/create-application';
import { createTestPersistence } from '@/composition/test-support';
import { InMemoryLogger } from '@/shared/infrastructure/logging';

const IDS = Array.from(
  { length: 40 },
  (_, index) => `0198f334-6dc5-7c20-9af1-${(0x91d7e59c0000 + index).toString(16)}`,
);

it('opens an availability request through its ministry team resource', async () => {
  const ids = [...IDS];
  const app = createApplication({
    persistence: createTestPersistence(),
    logger: new InMemoryLogger(),
    uuidSource: () => {
      const id = ids.shift();
      if (!id) throw new Error('Deterministic UUID source exhausted');
      return id;
    },
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
  const team = await app.inject({
    method: 'POST',
    url: `/organizations/${organizationId}/ministries/${ministry.json().id as string}/teams`,
    payload: { name: 'Louvor A' },
  });
  const ministryTeamId = team.json().id as string;
  const response = await app.inject({
    method: 'POST',
    url: `/organizations/${organizationId}/ministry-teams/${ministryTeamId}/availability-requests`,
    payload: {
      startDate: '2099-09-01',
      endDate: '2099-09-30',
      respondBy: '2099-08-25T23:59:59.000Z',
    },
  });
  await app.close();

  assert.equal(response.statusCode, 201);
  assert.deepEqual(response.json(), {
    id: response.json().id,
    organizationId,
    ministryTeamId,
    startDate: '2099-09-01',
    endDate: '2099-09-30',
    respondBy: '2099-08-25T23:59:59.000Z',
    status: 'open',
  });
});
