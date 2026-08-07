import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { fromMemberStatusCode, MemberStatusCodes, toMemberStatusCode } from './member-status-code';
import { UnsupportedMemberStatusCodeError } from './unsupported-member-status-code-error';

describe('toMemberStatusCode', () => {
  it('maps every domain status to its stable persistence code', () => {
    assert.equal(toMemberStatusCode('active'), MemberStatusCodes.Active);
    assert.equal(toMemberStatusCode('inactive'), MemberStatusCodes.Inactive);
    assert.notEqual(MemberStatusCodes.Active, MemberStatusCodes.Inactive);
  });
});

describe('fromMemberStatusCode', () => {
  it('maps every persisted status to the public domain vocabulary', () => {
    assert.equal(fromMemberStatusCode(MemberStatusCodes.Active), 'active');
    assert.equal(fromMemberStatusCode(MemberStatusCodes.Inactive), 'inactive');
  });

  it('rejects an unsupported persisted status with a stable code', () => {
    assert.throws(
      () => fromMemberStatusCode(99),
      (error: unknown) =>
        error instanceof UnsupportedMemberStatusCodeError &&
        error.code === 'member_status_code.unsupported',
    );
  });
});
