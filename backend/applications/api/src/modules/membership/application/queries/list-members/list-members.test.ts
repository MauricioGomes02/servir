import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ListMembersErrorCodes, ListMembersHandler, type MemberListReader } from './list-members';

const organizationId = '0198f334-6dc5-7c20-9af1-91d7e599e001';
const correlation = parseCorrelationId('0198f334-6dc5-7c20-9af1-91d7e599e002');
if (!correlation.success) throw new Error('invalid fixture');
const context = createExecutionContext({ correlationId: correlation.value });

describe('ListMembersHandler', () => {
  it('uses stable pagination defaults before reading', async () => {
    let received: Parameters<MemberListReader['list']>[0] | undefined;
    const reader: MemberListReader = {
      async list(criteria) {
        received = criteria;
        return { items: [], pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } };
      },
    };
    const result = await new ListMembersHandler(reader).handle({ organizationId }, context);
    assert.equal(result.success, true);
    assert.deepEqual(received && { page: received.page, pageSize: received.pageSize }, {
      page: 1,
      pageSize: 20,
    });
  });

  it('normalizes a prefix search and accepts a status filter', async () => {
    let received: Parameters<MemberListReader['list']>[0] | undefined;
    const reader: MemberListReader = {
      async list(criteria) {
        received = criteria;
        return { items: [], pagination: { page: 2, pageSize: 10, totalItems: 0, totalPages: 0 } };
      },
    };
    await new ListMembersHandler(reader).handle(
      { organizationId, page: '2', pageSize: '10', search: '  Mau  ', status: 'active' },
      context,
    );
    assert.equal(received?.search, 'Mau');
    assert.equal(received?.status, 'active');
  });

  it('reports every independent invalid filter before reading', async () => {
    let calls = 0;
    const reader: MemberListReader = {
      async list() {
        calls += 1;
        return undefined;
      },
    };
    const result = await new ListMembersHandler(reader).handle(
      { organizationId: 'bad', page: 0, pageSize: 101, search: 42, status: 'blocked' },
      context,
    );
    assert.equal(result.success, false);
    assert.equal(calls, 0);
    if (result.success || !('errors' in result.error)) assert.fail('expected accumulated errors');
    assert.deepEqual(
      result.error.errors.slice(1).map(({ code }) => code),
      [
        ListMembersErrorCodes.InvalidPage,
        ListMembersErrorCodes.InvalidPageSize,
        ListMembersErrorCodes.InvalidSearch,
        ListMembersErrorCodes.InvalidStatus,
      ],
    );
  });

  it('reports a missing organization without treating an empty page as absence', async () => {
    const reader: MemberListReader = {
      async list() {
        return undefined;
      },
    };
    const result = await new ListMembersHandler(reader).handle({ organizationId }, context);
    assert.equal(result.success, false);
    if (result.success) assert.fail('expected a missing organization');
    assert.equal(result.error.code, ListMembersErrorCodes.OrganizationNotFound);
  });
});
