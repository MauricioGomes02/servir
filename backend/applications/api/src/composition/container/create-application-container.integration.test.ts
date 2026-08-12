import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createApplicationContainer } from './create-application-container';
import { createPostgresPersistence } from '../create-postgres-persistence';
import { requireTestDatabaseUrl } from '@/test-support/postgres-integration';

describe('createApplicationContainer', () => {
  it('resolves shared dependencies once from the root container', () => {
    const persistence = createPostgresPersistence(requireTestDatabaseUrl());
    const container = createApplicationContainer({ persistence });

    assert.equal(container.resolve('mediator'), container.resolve('mediator'));
    assert.equal(container.resolve('translator'), container.resolve('translator'));
    return persistence.close();
  });
});
