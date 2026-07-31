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
  it('composes the first executable vertical slice', async () => {
    const ids = [...UUIDS];
    const logger = new InMemoryLogger();
    const monotonicInstants = [100, 142];
    const app = createApplication({
      logger,
      monotonicNow: () => monotonicInstants.shift() ?? 142,
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
    assert.equal(logger.records[0]?.eventName, 'http.request.completed');
    assert.deepEqual(logger.records[0]?.context, {
      correlationId: UUIDS[1],
      requestId: UUIDS[0],
    });
    assert.deepEqual(logger.records[0]?.attributes, {
      'http.request.method': 'POST',
      'http.route': '/organizations',
      'http.response.status_code': 201,
      'duration.ms': 42,
    });
  });
});
