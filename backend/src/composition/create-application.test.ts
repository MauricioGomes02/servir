import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { InMemoryLogger } from '@/shared/infrastructure/logging';

import { createApplication } from './create-application';

const UUIDS = [
  '0198f334-6dc5-7c20-9af1-91d7e599c7b1',
  '0198f334-6dc5-7c20-9af1-91d7e599c7b2',
  '0198f334-6dc5-7c20-9af1-91d7e599c7b3',
  '0198f334-6dc5-7c20-9af1-91d7e599c7b4',
  '0198f334-6dc5-7c20-9af1-91d7e599c7b5',
];

describe('createApplication', () => {
  it('compoe o primeiro corte vertical executavel', async () => {
    const ids = [...UUIDS];
    const logger = new InMemoryLogger();
    const app = createApplication({
      logger,
      uuidSource: () => {
        const id = ids.shift();

        if (id === undefined) {
          throw new Error('Deterministic UUID source exhausted');
        }

        return id;
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/organizations',
      payload: {
        name: 'Comunidade Servir',
      },
    });
    await app.close();

    assert.equal(response.statusCode, 201);
    assert.equal(response.headers['x-request-id'], UUIDS[0]);
    assert.equal(response.headers['x-correlation-id'], UUIDS[1]);
    assert.deepEqual(response.json(), {
      id: UUIDS[2],
      name: 'Comunidade Servir',
    });
    assert.equal(response.headers.location, `/organizations/${UUIDS[2]}`);
    assert.equal(ids.length, 0);
    assert.equal(logger.records.length, 1);
    assert.equal(logger.records[0]?.eventName, 'organization.created');
    assert.deepEqual(logger.records[0]?.context, {
      correlationId: UUIDS[1],
      messageId: UUIDS[4],
      causationId: undefined,
    });
  });
});
