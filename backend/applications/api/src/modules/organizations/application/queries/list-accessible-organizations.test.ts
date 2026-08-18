import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { UserId } from '@/modules/identity/domain';
import { OrganizationId } from '@/modules/organizations/domain';
import {
  createAuthenticatedActor,
  parseAuthenticatedUserId,
} from '@/shared/application/authentication';
import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';

import {
  type AccessibleOrganizationListReader,
  ListAccessibleOrganizationsHandler,
} from './list-accessible-organizations';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  if (!result.success) throw new Error('Invalid deterministic fixture');
  return result.value;
}

const userId = value(UserId.create('0198f334-6dc5-7c20-9af1-91d7e599e201'));
const context = createExecutionContext({
  correlationId: value(parseCorrelationId('0198f334-6dc5-7c20-9af1-91d7e599e202')),
  actor: createAuthenticatedActor(value(parseAuthenticatedUserId(userId.toString()))),
});

describe('ListAccessibleOrganizationsHandler', () => {
  it('lists organizations for the authenticated user identity', async () => {
    const organizations = Object.freeze([
      Object.freeze({
        id: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599e203')),
        name: 'Comunidade Servir',
      }),
    ]);
    let receivedUserId: UserId | undefined;
    const reader: AccessibleOrganizationListReader = {
      async listByUserId(candidate) {
        receivedUserId = candidate;
        return organizations;
      },
    };

    const result = await new ListAccessibleOrganizationsHandler(reader).handle({}, context);

    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(receivedUserId?.equals(userId), true);
    assert.equal(result.value, organizations);
  });

  it('rejects a call without an authenticated user before reading', async () => {
    let reads = 0;
    const reader: AccessibleOrganizationListReader = {
      async listByUserId() {
        reads += 1;
        return [];
      },
    };
    const anonymousContext = createExecutionContext({ correlationId: context.correlationId });

    const result = await new ListAccessibleOrganizationsHandler(reader).handle(
      {},
      anonymousContext,
    );

    assert.deepEqual(result, {
      success: false,
      error: { code: 'organization.accessible_list.authenticated_actor_required' },
    });
    assert.equal(reads, 0);
  });
});
