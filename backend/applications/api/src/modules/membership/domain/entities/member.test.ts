import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { OrganizationId } from '@/modules/organizations/domain';
import { parseDomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';

import {
  Member,
  MemberId,
} from '.';
import { MemberNameErrorCodes } from '../value-objects';

function validMetadata() {
  const id = MemberId.create('0198f334-6dc5-7c20-9af1-91d7e599d7b1');
  const organizationId = OrganizationId.create(
    '0198f334-6dc5-7c20-9af1-91d7e599c7b1',
  );
  const eventId = parseDomainEventId(
    '0198f334-6dc5-7c20-9af1-91d7e599d7b2',
  );
  const occurredAt = Instant.create('2026-08-03T15:00:00.000Z');

  assert.equal(id.success, true);
  assert.equal(organizationId.success, true);
  assert.equal(eventId.success, true);
  assert.equal(occurredAt.success, true);

  if (
    !id.success
    || !organizationId.success
    || !eventId.success
    || !occurredAt.success
  ) {
    throw new Error('Invalid deterministic test fixture');
  }

  return {
    id: id.value,
    organizationId: organizationId.value,
    eventId: eventId.value,
    registeredAt: occurredAt.value,
  };
}

describe('Member', () => {
  it('registers an active member and records the occurred fact', () => {
    const metadata = validMetadata();

    const result = Member.register({
      ...metadata,
      name: '  Maria da Silva  ',
    });

    assert.equal(result.success, true);

    if (!result.success) {
      return;
    }

    assert.equal(result.value.id, metadata.id);
    assert.equal(result.value.organizationId, metadata.organizationId);
    assert.equal(result.value.name.toString(), 'Maria da Silva');
    assert.equal(result.value.status, 'active');
    assert.equal(result.value.registeredAt, metadata.registeredAt);
    assert.deepEqual(result.value.pendingDomainEvents, [{
      eventId: metadata.eventId,
      name: 'member.registered',
      occurredAt: metadata.registeredAt,
      payload: {
        memberId: '0198f334-6dc5-7c20-9af1-91d7e599d7b1',
        organizationId: '0198f334-6dc5-7c20-9af1-91d7e599c7b1',
        name: 'Maria da Silva',
      },
    }]);
  });

  it('registers neither member nor fact when the name is invalid', () => {
    assert.deepEqual(Member.register({
      ...validMetadata(),
      name: '   ',
    }), {
      success: false,
      error: {
        code: MemberNameErrorCodes.Empty,
        field: 'name',
      },
    });
  });
});
