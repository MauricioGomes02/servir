import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import {
  GetActivityDetailsErrorCodes,
  GetActivityDetailsHandler,
  type ActivityDetailsReader,
} from './get-activity-details';

const organizationId = '0198f334-6dc5-7c20-9af1-91d7e599c7b2';
const activityId = '0198f334-6dc5-7c20-9af1-91d7e599c7b3';
const correlation = parseCorrelationId('0198f334-6dc5-7c20-9af1-91d7e599c7b1');
if (!correlation.success) throw new Error('invalid fixture');
const context = createExecutionContext({ correlationId: correlation.value });

describe('GetActivityDetailsHandler', () => {
  it('reads activity details inside the organization boundary', async () => {
    let received: readonly string[] = [];
    const reader: ActivityDetailsReader = {
      async find(organization, activity) {
        received = [organization.toString(), activity.toString()];
        return { id: activity, name: 'Culto', status: 'active', ministries: [] };
      },
    };
    const result = await new GetActivityDetailsHandler(reader).handle(
      { organizationId, activityId },
      context,
    );
    assert.equal(result.success, true);
    assert.deepEqual(received, [organizationId, activityId]);
  });

  it('reports invalid identifiers together before reading', async () => {
    let reads = 0;
    const reader: ActivityDetailsReader = {
      async find() {
        reads += 1;
        return undefined;
      },
    };
    const result = await new GetActivityDetailsHandler(reader).handle(
      { organizationId: 'invalid', activityId: 'also-invalid' },
      context,
    );
    assert.equal(result.success, false);
    if (!result.success && 'errors' in result.error)
      assert.deepEqual(
        result.error.errors.map(({ code }) => code),
        ['organization.id.invalid_format', 'activity_id.invalid_format'],
      );
    assert.equal(reads, 0);
  });

  it('returns an expected failure when the tenant-scoped activity is absent', async () => {
    const reader: ActivityDetailsReader = {
      async find() {
        return undefined;
      },
    };
    const result = await new GetActivityDetailsHandler(reader).handle(
      { organizationId, activityId },
      context,
    );
    assert.deepEqual(result, {
      success: false,
      error: { code: GetActivityDetailsErrorCodes.ActivityNotFound, field: 'activityId' },
    });
  });
});
