import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  MemberStatusCodes,
  toMemberStatusCode,
} from './member-status-code';

describe('toMemberStatusCode', () => {
  it('maps every domain status to its stable persistence code', () => {
    assert.equal(toMemberStatusCode('active'), MemberStatusCodes.Active);
    assert.equal(toMemberStatusCode('inactive'), MemberStatusCodes.Inactive);
    assert.notEqual(MemberStatusCodes.Active, MemberStatusCodes.Inactive);
  });
});
