import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createApplicationContainer } from './create-application-container';
import { createTestPersistence } from '../test-support';

describe('createApplicationContainer', () => {
  it('resolves shared dependencies once from the root container', () => {
    const container = createApplicationContainer({ persistence: createTestPersistence() });

    assert.equal(container.resolve('mediator'), container.resolve('mediator'));
    assert.equal(container.resolve('translator'), container.resolve('translator'));
  });
});
