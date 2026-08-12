import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import {
  ListMinistriesErrorCodes,
  ListMinistriesHandler,
  type MinistryListReader,
} from './list-ministries';

const correlation = parseCorrelationId('0198f334-6dc5-7c20-9af1-91d7e599c7b1');
if (!correlation.success) throw new Error('invalid fixture');
const context = createExecutionContext({ correlationId: correlation.value });
const organizationId = '0198f334-6dc5-7c20-9af1-91d7e599c7b2';

describe('ListMinistriesHandler', () => {
  it('uses stable pagination defaults before reading', async () => {
    let received: Parameters<MinistryListReader['list']>[0] | undefined;
    const reader: MinistryListReader = {
      async list(criteria) {
        received = criteria;
        return { items: [], pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } };
      },
    };
    const result = await new ListMinistriesHandler(reader).handle({ organizationId }, context);
    assert.equal(result.success, true);
    assert.equal(received?.page, 1);
    assert.equal(received?.pageSize, 20);
  });

  it('normalizes a prefix search and accepts a status filter', async () => {
    let received: Parameters<MinistryListReader['list']>[0] | undefined;
    const reader: MinistryListReader = {
      async list(criteria) {
        received = criteria;
        return {
          items: [],
          pagination: {
            page: criteria.page,
            pageSize: criteria.pageSize,
            totalItems: 0,
            totalPages: 0,
          },
        };
      },
    };
    await new ListMinistriesHandler(reader).handle(
      { organizationId, search: '  Louvor  ', status: 'active', page: '2', pageSize: '10' },
      context,
    );
    assert.equal(received?.search, 'Louvor');
    assert.equal(received?.status, 'active');
    assert.equal(received?.page, 2);
  });

  it('reports every independent invalid filter before reading', async () => {
    let reads = 0;
    const reader: MinistryListReader = {
      async list() {
        reads += 1;
        throw new Error('unexpected');
      },
    };
    const result = await new ListMinistriesHandler(reader).handle(
      { organizationId: 'invalid', page: 0, pageSize: 101, search: 42, status: 'archived' },
      context,
    );
    assert.equal(result.success, false);
    if (!result.success && 'errors' in result.error)
      assert.deepEqual(
        result.error.errors.map(({ code }) => code),
        [
          'organization.id.invalid_format',
          ListMinistriesErrorCodes.InvalidPage,
          ListMinistriesErrorCodes.InvalidPageSize,
          ListMinistriesErrorCodes.InvalidSearch,
          ListMinistriesErrorCodes.InvalidStatus,
        ],
      );
    assert.equal(reads, 0);
  });
});
