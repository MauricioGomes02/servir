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
  '0198f334-6dc5-7c20-9af1-91d7e599c7b6',
  '0198f334-6dc5-7c20-9af1-91d7e599c7b7',
  '0198f334-6dc5-7c20-9af1-91d7e599c7b8',
  '0198f334-6dc5-7c20-9af1-91d7e599c7b9',
  '0198f334-6dc5-7c20-9af1-91d7e599c7ba',
  '0198f334-6dc5-7c20-9af1-91d7e599c7bb',
  '0198f334-6dc5-7c20-9af1-91d7e599c7bc',
];

describe('createApplication', () => {
  it('composes the first executable vertical slice', async () => {
    const ids = [...UUIDS];
    const logger = new InMemoryLogger();
    const monotonicInstants = [100, 142, 200, 250, 300, 325];
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
    assert.equal(response.statusCode, 201);
    assert.equal(response.headers['x-request-id'], UUIDS[0]);
    assert.equal(response.headers['x-correlation-id'], UUIDS[1]);
    assert.deepEqual(response.json(), {
      id: UUIDS[2],
      name: 'Comunidade Servir',
    });
    assert.equal(response.headers.location, `/organizations/${UUIDS[2]}`);
    const memberResponse = await app.inject({
      method: 'POST',
      url: `/organizations/${UUIDS[2]}/members`,
      payload: {
        name: 'Maria da Silva',
      },
    });
    assert.equal(memberResponse.statusCode, 201);
    assert.equal(memberResponse.headers['x-request-id'], UUIDS[5]);
    assert.equal(memberResponse.headers['x-correlation-id'], UUIDS[6]);
    assert.deepEqual(memberResponse.json(), {
      id: UUIDS[7],
      organizationId: UUIDS[2],
      name: 'Maria da Silva',
    });
    assert.equal(
      memberResponse.headers.location,
      `/organizations/${UUIDS[2]}/members/${UUIDS[7]}`,
    );

    const detailsResponse = await app.inject({
      method: 'GET',
      url: `/organizations/${UUIDS[2]}/members/${UUIDS[7]}`,
    });
    await app.close();

    assert.equal(detailsResponse.statusCode, 200);
    assert.deepEqual(detailsResponse.json(), {
      id: UUIDS[7],
      organizationId: UUIDS[2],
      name: 'Maria da Silva',
      status: 'active',
    });
    assert.equal(ids.length, 0);
    assert.deepEqual(
      logger.records.slice(0, 4).map((record) => record.eventName),
      [
        'organization.creation.started',
        'organization.creation.validated',
        'organization.creation.persisted',
        'organization.creation.completed',
      ],
    );
    const requestRecords = logger.records.filter(
      (record) => record.eventName === 'http.request.completed',
    );
    assert.equal(requestRecords.length, 3);
    assert.deepEqual(requestRecords[0]?.context, {
      correlationId: UUIDS[1],
      requestId: UUIDS[0],
    });
    assert.deepEqual(requestRecords[0]?.attributes, {
      'http.request.method': 'POST',
      'http.route': '/organizations',
      'http.response.status_code': 201,
      'duration.ms': 42,
    });
    assert.deepEqual(requestRecords[1]?.attributes, {
      'http.request.method': 'POST',
      'http.route': '/organizations/:organizationId/members',
      'http.response.status_code': 201,
      'duration.ms': 50,
    });
    assert.deepEqual(requestRecords[2]?.attributes, {
      'http.request.method': 'GET',
      'http.route': '/organizations/:organizationId/members/:memberId',
      'http.response.status_code': 200,
      'duration.ms': 25,
    });
  });

  it('distinguishes malformed and missing organization resources', async () => {
    const ids = [...UUIDS.slice(0, 6)];
    const instants = [0, 1, 2, 3, 4, 5];
    const app = createApplication({
      logger: new InMemoryLogger(),
      monotonicNow: () => instants.shift() ?? 3,
      uuidSource: () => {
        const id = ids.shift();

        if (id === undefined) {
          throw new Error('Deterministic UUID source exhausted');
        }

        return id;
      },
    });

    const malformedResponse = await app.inject({
      method: 'POST',
      url: '/organizations/not-a-uuid/members',
      payload: { name: 'Maria da Silva' },
    });
    const missingResponse = await app.inject({
      method: 'POST',
      url: `/organizations/${UUIDS[4]}/members`,
      headers: { 'accept-language': 'en-US' },
      payload: { name: 'Maria da Silva' },
    });
    const missingMemberResponse = await app.inject({
      method: 'GET',
      url: `/organizations/${UUIDS[4]}/members/${UUIDS[5]}`,
      headers: { 'accept-language': 'en-US' },
    });
    await app.close();

    assert.equal(malformedResponse.statusCode, 400);
    assert.equal(malformedResponse.json().type, '/problems/invalid-request');
    assert.equal(
      malformedResponse.json().errors[0].code,
      'organization.id.invalid_format',
    );
    assert.equal(missingResponse.statusCode, 404);
    assert.equal(
      missingResponse.json().type,
      '/problems/resource-not-found',
    );
    assert.equal(
      missingResponse.json().title,
      'The requested resource was not found.',
    );
    assert.equal(
      missingResponse.json().errors[0].code,
      'member.registration.organization_not_found',
    );
    assert.equal(missingMemberResponse.statusCode, 404);
    assert.equal(
      missingMemberResponse.json().type,
      '/problems/resource-not-found',
    );
    assert.equal(
      missingMemberResponse.json().errors[0].code,
      'member.details.not_found',
    );
  });
});
