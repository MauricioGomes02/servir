import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createMemberDetails } from '../../application';
import { Member, MemberId } from '../../domain';
import { OrganizationId } from '@/modules/organizations/domain';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';

import { InMemoryMemberDetailsReader } from './in-memory-member-details-reader';
import { assertMemberDetailsReaderContract } from './member-details-reader.contract';

function requireValue<T>(result: Readonly<
  { success: true; value: T } | { success: false }
>): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid deterministic fixture');
  return result.value;
}

describe('InMemoryMemberDetailsReader', () => {
  it('satisfies the member details reader contract from a live source', async () => {
    const organizationId = requireValue(OrganizationId.create(
      '0198f334-6dc5-7c20-9af1-91d7e599c7b1',
    ));
    const memberId = requireValue(MemberId.create(
      '0198f334-6dc5-7c20-9af1-91d7e599c7b2',
    ));
    const members: Member[] = [];
    const reader = new InMemoryMemberDetailsReader(() => members);
    const member = requireValue(Member.register({
      id: memberId,
      organizationId,
      name: 'Maria da Silva',
      eventId: requireValue(parseDomainEventId(
        '0198f334-6dc5-7c20-9af1-91d7e599c7b3',
      )),
      registeredAt: requireValue(Instant.create(
        '2026-08-05T12:00:00.000Z',
      )),
    }));

    members.push(member);

    await assertMemberDetailsReaderContract({
      reader,
      expected: createMemberDetails({
        id: memberId,
        organizationId,
        name: 'Maria da Silva',
        status: 'active',
      }),
      anotherOrganizationId: requireValue(OrganizationId.create(
        '0198f334-6dc5-7c20-9af1-91d7e599c7b4',
      )),
      missingMemberId: requireValue(MemberId.create(
        '0198f334-6dc5-7c20-9af1-91d7e599c7b5',
      )),
    });
  });
});
