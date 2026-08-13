import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import {
  GetMinistryDetailsErrorCodes,
  GetMinistryDetailsHandler,
  type MinistryDetailsReader,
} from './get-ministry-details';

const organizationId = '0198f334-6dc5-7c20-9af1-91d7e599c7b2';
const ministryId = '0198f334-6dc5-7c20-9af1-91d7e599c7b3';
const correlation = parseCorrelationId('0198f334-6dc5-7c20-9af1-91d7e599c7b1');
if (!correlation.success) throw new Error('invalid fixture');
const context = createExecutionContext({ correlationId: correlation.value });

describe('GetMinistryDetailsHandler', () => {
  it('reads a ministry inside its organization boundary', async () => {
    let received: readonly string[] = [];
    const reader: MinistryDetailsReader = {
      async find(organization, ministry) {
        received = [organization.toString(), ministry.toString()];
        return { id: ministry, name: 'Louvor', status: 'active', roles: [] };
      },
    };
    const result = await new GetMinistryDetailsHandler(reader).handle(
      { organizationId, ministryId },
      context,
    );
    assert.equal(result.success, true);
    assert.deepEqual(received, [organizationId, ministryId]);
  });

  it('reports every invalid identifier before reading', async () => {
    let reads = 0;
    const reader: MinistryDetailsReader = {
      async find() {
        reads += 1;
        return undefined;
      },
    };
    const result = await new GetMinistryDetailsHandler(reader).handle(
      { organizationId: 'invalid', ministryId: 'also-invalid' },
      context,
    );
    assert.equal(result.success, false);
    if (!result.success && 'errors' in result.error)
      assert.deepEqual(
        result.error.errors.map(({ code }) => code),
        ['organization.id.invalid_format', 'ministry.id.invalid_format'],
      );
    assert.equal(reads, 0);
  });

  it('returns an expected failure when the tenant-scoped ministry is absent', async () => {
    const reader: MinistryDetailsReader = {
      async find() {
        return undefined;
      },
    };
    const result = await new GetMinistryDetailsHandler(reader).handle(
      { organizationId, ministryId },
      context,
    );
    assert.deepEqual(result, {
      success: false,
      error: { code: GetMinistryDetailsErrorCodes.MinistryNotFound, field: 'ministryId' },
    });
  });
});
