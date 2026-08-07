import assert from 'node:assert/strict';

import type { MemberDetails, MemberDetailsReader } from '../../application';
import type { MemberId } from '../../domain';
import type { OrganizationId } from '@/modules/organizations/domain';

export interface MemberDetailsReaderContractInput {
  readonly reader: MemberDetailsReader;
  readonly expected: MemberDetails;
  readonly anotherOrganizationId: OrganizationId;
  readonly missingMemberId: MemberId;
}

export async function assertMemberDetailsReaderContract(
  input: MemberDetailsReaderContractInput,
): Promise<void> {
  assert.deepEqual(
    await input.reader.findById(input.expected.organizationId, input.expected.id),
    input.expected,
  );
  assert.equal(
    await input.reader.findById(input.anotherOrganizationId, input.expected.id),
    undefined,
  );
  assert.equal(
    await input.reader.findById(input.expected.organizationId, input.missingMemberId),
    undefined,
  );
}
