import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MemberId, MemberIdErrorCodes } from '@/modules/membership/domain';
import { OrganizationId, OrganizationIdErrorCodes } from '@/modules/organizations/domain';
import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import { InMemoryLogger } from '@/shared/infrastructure/logging';

import { GetMemberDetailsErrorCodes } from './get-member-details-error';
import { GetMemberDetailsHandler } from './get-member-details-handler';
import { createMemberDetails } from './member-details';
import type { MemberDetailsReader } from './member-details-reader';

function requireValue<T>(result: Readonly<{ success: true; value: T } | { success: false }>): T {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid deterministic fixture');
  return result.value;
}

const organizationId = requireValue(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599c7b1'));
const memberId = requireValue(MemberId.create('0198f334-6dc5-7c20-9af1-91d7e599c7b2'));
const correlationId = requireValue(parseCorrelationId('correlation-123'));
const context = createExecutionContext({ correlationId });

function handler(reader: MemberDetailsReader, logger = new InMemoryLogger()) {
  return { handler: new GetMemberDetailsHandler(reader, logger), logger };
}

describe('GetMemberDetailsHandler', () => {
  it('returns the read model provided by the dedicated reader', async () => {
    const expected = createMemberDetails({
      id: memberId,
      organizationId,
      name: 'Maria da Silva',
      status: 'active',
    });
    const reader: MemberDetailsReader = {
      async findById() {
        return expected;
      },
    };

    const result = await handler(reader).handler.handle(
      {
        organizationId: organizationId.toString(),
        memberId: memberId.toString(),
      },
      context,
    );

    assert.deepEqual(result, { success: true, value: expected });
  });

  it('rejects an invalid organization identifier before reading', async () => {
    let reads = 0;
    const reader: MemberDetailsReader = {
      async findById() {
        reads += 1;
        return undefined;
      },
    };

    const result = await handler(reader).handler.handle(
      {
        organizationId: 'invalid',
        memberId: memberId.toString(),
      },
      context,
    );

    assert.equal(result.success, false);
    if (result.success) return;
    assert.equal(result.error.code, OrganizationIdErrorCodes.InvalidFormat);
    assert.equal(reads, 0);
  });

  it('rejects an invalid member identifier before reading', async () => {
    let reads = 0;
    const reader: MemberDetailsReader = {
      async findById() {
        reads += 1;
        return undefined;
      },
    };

    const result = await handler(reader).handler.handle(
      {
        organizationId: organizationId.toString(),
        memberId: 'invalid',
      },
      context,
    );

    assert.equal(result.success, false);
    if (result.success) return;
    assert.equal(result.error.code, MemberIdErrorCodes.InvalidFormat);
    assert.equal(reads, 0);
  });

  it('returns a stable absence when the member does not belong to the organization', async () => {
    const reader: MemberDetailsReader = {
      async findById() {
        return undefined;
      },
    };

    const result = await handler(reader).handler.handle(
      {
        organizationId: organizationId.toString(),
        memberId: memberId.toString(),
      },
      context,
    );

    assert.deepEqual(result, {
      success: false,
      error: {
        code: GetMemberDetailsErrorCodes.NotFound,
        field: 'memberId',
      },
    });
  });

  it('records found and absent outcomes without the read model content', async () => {
    const expected = createMemberDetails({
      id: memberId,
      organizationId,
      name: 'Maria da Silva',
      status: 'active',
    });
    const foundLogger = new InMemoryLogger();
    const found = handler({ findById: async () => expected }, foundLogger);

    await found.handler.handle(
      {
        organizationId: organizationId.value,
        memberId: memberId.value,
      },
      context,
    );

    assert.deepEqual(
      foundLogger.records.map((record) => record.eventName),
      [
        'member.details.retrieval.started',
        'member.details.retrieval.criteria_validated',
        'member.details.retrieval.completed',
      ],
    );
    assert.equal(JSON.stringify(foundLogger.records).includes('Maria da Silva'), false);

    const absentLogger = new InMemoryLogger();
    const absent = handler({ findById: async () => undefined }, absentLogger);
    await absent.handler.handle(
      {
        organizationId: organizationId.value,
        memberId: memberId.value,
      },
      context,
    );
    assert.equal(absentLogger.records.at(-1)?.eventName, 'member.details.retrieval.not_found');
  });
});
