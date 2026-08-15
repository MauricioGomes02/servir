import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import {
  ListActivitiesErrorCodes,
  ListActivitiesHandler,
  type ActivityListReader,
} from './list-activities';

const organizationId = '0198f334-6dc5-7c20-9af1-91d7e599c7b2';
const correlation = parseCorrelationId('0198f334-6dc5-7c20-9af1-91d7e599c7b1');
if (!correlation.success) throw new Error('invalid fixture');
const context = createExecutionContext({ correlationId: correlation.value });

describe('ListActivitiesHandler', () => {
  it('normalizes filters and uses stable pagination defaults', async () => {
    let received: Parameters<ActivityListReader['list']>[0] | undefined;
    const reader: ActivityListReader = {
      async list(criteria) {
        received = criteria;
        return { items: [], pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 } };
      },
    };
    const result = await new ListActivitiesHandler(reader).handle(
      { organizationId, search: '  Culto  ', status: 'active' },
      context,
    );
    assert.equal(result.success, true);
    assert.equal(received?.search, 'Culto');
    assert.equal(received?.status, 'active');
    assert.equal(received?.page, 1);
    assert.equal(received?.pageSize, 20);
  });

  it('reports every independent invalid filter before reading', async () => {
    let reads = 0;
    const reader: ActivityListReader = {
      async list() {
        reads += 1;
        throw new Error('unexpected');
      },
    };
    const result = await new ListActivitiesHandler(reader).handle(
      { organizationId: 'invalid', page: 0, pageSize: 101, search: 42, status: 'archived' },
      context,
    );
    assert.equal(result.success, false);
    if (!result.success && 'errors' in result.error)
      assert.deepEqual(
        result.error.errors.map(({ code }) => code),
        [
          'organization.id.invalid_format',
          ListActivitiesErrorCodes.InvalidPage,
          ListActivitiesErrorCodes.InvalidPageSize,
          ListActivitiesErrorCodes.InvalidSearch,
          ListActivitiesErrorCodes.InvalidStatus,
        ],
      );
    assert.equal(reads, 0);
  });
});
