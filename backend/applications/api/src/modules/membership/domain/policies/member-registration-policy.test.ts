import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { OrganizationId } from '@/modules/organizations/domain';

import { MemberRegistrationPolicy, MemberRegistrationPolicyErrorCodes } from '.';

function organizationRegistrationFacts() {
  const organizationId = OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599c7b1');

  assert.equal(organizationId.success, true);

  if (!organizationId.success) {
    throw new Error('Invalid deterministic test fixture');
  }

  return Object.freeze({
    organizationId: organizationId.value,
  });
}

describe('MemberRegistrationPolicy', () => {
  it('allows registration when the organization exists', () => {
    const policy = new MemberRegistrationPolicy();

    assert.deepEqual(
      policy.evaluate({
        organization: organizationRegistrationFacts(),
      }),
      {
        success: true,
        value: undefined,
      },
    );
  });

  it('rejects registration when the organization does not exist', () => {
    const policy = new MemberRegistrationPolicy();

    assert.deepEqual(policy.evaluate({ organization: undefined }), {
      success: false,
      error: {
        code: MemberRegistrationPolicyErrorCodes.OrganizationNotFound,
        field: 'organizationId',
      },
    });
  });
});
