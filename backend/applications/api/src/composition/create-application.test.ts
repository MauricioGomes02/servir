import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { InMemoryLogger } from '@/shared/infrastructure/logging';

import { createApplication } from './create-application';
import { createTestPersistence } from './test-support';

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
  '0198f334-6dc5-7c20-9af1-91d7e599c7bd',
  '0198f334-6dc5-7c20-9af1-91d7e599c7be',
  '0198f334-6dc5-7c20-9af1-91d7e599c7bf',
  '0198f334-6dc5-7c20-9af1-91d7e599c7c0',
  '0198f334-6dc5-7c20-9af1-91d7e599c7c1',
  '0198f334-6dc5-7c20-9af1-91d7e599c7c2',
  '0198f334-6dc5-7c20-9af1-91d7e599c7c3',
  '0198f334-6dc5-7c20-9af1-91d7e599c7c4',
  '0198f334-6dc5-7c20-9af1-91d7e599c7c5',
  '0198f334-6dc5-7c20-9af1-91d7e599c7c6',
  '0198f334-6dc5-7c20-9af1-91d7e599c7c7',
  '0198f334-6dc5-7c20-9af1-91d7e599c7c8',
  '0198f334-6dc5-7c20-9af1-91d7e599c7c9',
  '0198f334-6dc5-7c20-9af1-91d7e599c7ca',
  '0198f334-6dc5-7c20-9af1-91d7e599c7cb',
  '0198f334-6dc5-7c20-9af1-91d7e599c7cc',
  '0198f334-6dc5-7c20-9af1-91d7e599c7cd',
  '0198f334-6dc5-7c20-9af1-91d7e599c7ce',
  '0198f334-6dc5-7c20-9af1-91d7e599c7cf',
  '0198f334-6dc5-7c20-9af1-91d7e599c7d0',
  '0198f334-6dc5-7c20-9af1-91d7e599c7d1',
  '0198f334-6dc5-7c20-9af1-91d7e599c7d2',
  '0198f334-6dc5-7c20-9af1-91d7e599c7d3',
  '0198f334-6dc5-7c20-9af1-91d7e599c7d4',
  '0198f334-6dc5-7c20-9af1-91d7e599c7d5',
];

describe('createApplication', () => {
  it('exposes a transport-level liveness probe without touching persistence', async () => {
    const app = createApplication({
      persistence: createTestPersistence(),
      logger: new InMemoryLogger(),
    });
    const response = await app.inject({ method: 'GET', url: '/health/live' });
    await app.close();

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { status: 'ok' });
  });

  it('composes the first executable vertical slice', async () => {
    const ids = [...UUIDS];
    const logger = new InMemoryLogger();
    const monotonicInstants = [
      100, 142, 200, 250, 300, 325, 400, 410, 500, 520, 600, 610, 700, 725, 800, 825, 900, 925,
    ];
    const app = createApplication({
      persistence: createTestPersistence(),
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
    assert.equal(memberResponse.headers.location, `/organizations/${UUIDS[2]}/members/${UUIDS[7]}`);

    const ministryResponse = await app.inject({
      method: 'POST',
      url: `/organizations/${UUIDS[2]}/ministries`,
      payload: { name: 'Louvor' },
    });
    assert.equal(ministryResponse.statusCode, 201);
    assert.deepEqual(ministryResponse.json(), {
      id: UUIDS[12],
      organizationId: UUIDS[2],
      name: 'Louvor',
      status: 'active',
    });
    assert.equal(
      ministryResponse.headers.location,
      `/organizations/${UUIDS[2]}/ministries/${UUIDS[12]}`,
    );

    const conflictResponse = await app.inject({
      method: 'POST',
      url: `/organizations/${UUIDS[2]}/ministries`,
      payload: { name: 'louvor' },
    });
    assert.equal(conflictResponse.statusCode, 409);
    assert.equal(conflictResponse.json().type, '/problems/resource-conflict');
    assert.equal(
      conflictResponse.json().errors[0].code,
      'ministry.creation.active_name_already_exists',
    );

    const roleResponse = await app.inject({
      method: 'POST',
      url: `/organizations/${UUIDS[2]}/ministries/${UUIDS[12]}/roles`,
      payload: { name: 'Vocal' },
    });
    assert.equal(roleResponse.statusCode, 201);
    assert.deepEqual(roleResponse.json(), {
      id: UUIDS[19],
      ministryId: UUIDS[12],
      organizationId: UUIDS[2],
      name: 'Vocal',
      status: 'active',
    });
    assert.equal(
      roleResponse.headers.location,
      `/organizations/${UUIDS[2]}/ministries/${UUIDS[12]}/roles/${UUIDS[19]}`,
    );

    const roleConflictResponse = await app.inject({
      method: 'POST',
      url: `/organizations/${UUIDS[2]}/ministries/${UUIDS[12]}/roles`,
      payload: { name: 'vocal' },
    });
    assert.equal(roleConflictResponse.statusCode, 409);
    assert.equal(
      roleConflictResponse.json().errors[0].code,
      'ministry_role.definition.active_name_already_exists',
    );

    const membershipResponse = await app.inject({
      method: 'POST',
      url: `/organizations/${UUIDS[2]}/ministries/${UUIDS[12]}/memberships`,
      payload: { memberId: UUIDS[7] },
    });
    assert.equal(membershipResponse.statusCode, 201);
    assert.deepEqual(membershipResponse.json(), {
      id: UUIDS[28],
      organizationId: UUIDS[2],
      ministryId: UUIDS[12],
      memberId: UUIDS[7],
      status: 'requested',
    });

    const detailsResponse = await app.inject({
      method: 'GET',
      url: `/organizations/${UUIDS[2]}/members/${UUIDS[7]}`,
    });
    const ministriesResponse = await app.inject({
      method: 'GET',
      url: `/organizations/${UUIDS[2]}/ministries?pageSize=1&search=lou&status=active`,
    });
    assert.equal(ministriesResponse.statusCode, 200);
    assert.deepEqual(ministriesResponse.json(), {
      items: [{ id: UUIDS[12], name: 'Louvor', status: 'active' }],
      pagination: { page: 1, pageSize: 1, totalItems: 1, totalPages: 1 },
    });
    const membersResponse = await app.inject({
      method: 'GET',
      url: `/organizations/${UUIDS[2]}/members?pageSize=1&search=mar&status=active`,
    });
    assert.equal(membersResponse.statusCode, 200);
    assert.deepEqual(membersResponse.json(), {
      items: [{ id: UUIDS[7], name: 'Maria da Silva', status: 'active' }],
      pagination: { page: 1, pageSize: 1, totalItems: 1, totalPages: 1 },
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
    assert.equal(requestRecords.length, 10);
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
      'http.request.method': 'POST',
      'http.route': '/organizations/:organizationId/ministries',
      'http.response.status_code': 201,
      'duration.ms': 25,
    });
    assert.deepEqual(requestRecords[3]?.attributes, {
      'http.request.method': 'POST',
      'http.route': '/organizations/:organizationId/ministries',
      'http.response.status_code': 409,
      'duration.ms': 10,
    });
    assert.deepEqual(requestRecords[4]?.attributes, {
      'http.request.method': 'POST',
      'http.route': '/organizations/:organizationId/ministries/:ministryId/roles',
      'http.response.status_code': 201,
      'duration.ms': 20,
    });
    assert.deepEqual(requestRecords[5]?.attributes, {
      'http.request.method': 'POST',
      'http.route': '/organizations/:organizationId/ministries/:ministryId/roles',
      'http.response.status_code': 409,
      'duration.ms': 10,
    });
    assert.deepEqual(requestRecords[6]?.attributes, {
      'http.request.method': 'POST',
      'http.route': '/organizations/:organizationId/ministries/:ministryId/memberships',
      'http.response.status_code': 201,
      'duration.ms': 25,
    });
    assert.deepEqual(requestRecords[7]?.attributes, {
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
      persistence: createTestPersistence(),
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
    assert.equal(malformedResponse.json().errors[0].code, 'organization.id.invalid_format');
    assert.equal(missingResponse.statusCode, 404);
    assert.equal(missingResponse.json().type, '/problems/resource-not-found');
    assert.equal(missingResponse.json().title, 'The requested resource was not found.');
    assert.equal(
      missingResponse.json().errors[0].code,
      'member.registration.organization_not_found',
    );
    assert.equal(missingMemberResponse.statusCode, 404);
    assert.equal(missingMemberResponse.json().type, '/problems/resource-not-found');
    assert.equal(missingMemberResponse.json().errors[0].code, 'member.details.not_found');
  });
});
