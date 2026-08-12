import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';

import {
  GetOrganizationDetailsErrorCodes,
  GetOrganizationDetailsHandler,
  type OrganizationDetailsReader,
} from './get-organization-details';

const id = '0198f334-6dc5-7c20-9af1-91d7e599c7b1';
const correlationId = parseCorrelationId('0198f334-6dc5-7c20-9af1-91d7e599c7b3');
if (!correlationId.success) throw new Error('invalid fixture');
const context = createExecutionContext({ correlationId: correlationId.value });

describe('GetOrganizationDetailsHandler', () => {
  it('returns the organization read model scoped by its identity', async () => {
    const reader: OrganizationDetailsReader = {
      async findById(organizationId) {
        return Object.freeze({ id: organizationId, name: 'Comunidade Servir' });
      },
    };
    const result = await new GetOrganizationDetailsHandler(reader).handle(
      { organizationId: id },
      context,
    );
    assert.equal(result.success, true);
    if (result.success) assert.equal(result.value.name, 'Comunidade Servir');
  });

  it('rejects an invalid identity before reading', async () => {
    let reads = 0;
    const reader: OrganizationDetailsReader = {
      async findById() {
        reads += 1;
        return undefined;
      },
    };
    const result = await new GetOrganizationDetailsHandler(reader).handle(
      { organizationId: 'invalid' },
      context,
    );
    assert.equal(result.success, false);
    assert.equal(reads, 0);
  });

  it('returns a stable absence when the organization does not exist', async () => {
    const reader: OrganizationDetailsReader = { async findById() { return undefined; } };
    const result = await new GetOrganizationDetailsHandler(reader).handle(
      { organizationId: id },
      context,
    );
    assert.deepEqual(result, {
      success: false,
      error: { code: GetOrganizationDetailsErrorCodes.NotFound, field: 'organizationId' },
    });
  });
});
