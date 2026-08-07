import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ApplicationPersistenceConfigurationError } from '../application-persistence-configuration-error';
import { createApplicationContainer } from './create-application-container';

describe('createApplicationContainer', () => {
  it('resolves module dependencies once from the root container', () => {
    const container = createApplicationContainer({});

    assert.equal(
      container.resolve('createOrganizationHandler'),
      container.resolve('createOrganizationHandler'),
    );
    assert.equal(
      container.resolve('registerMemberHandler'),
      container.resolve('registerMemberHandler'),
    );
    assert.equal(container.resolve('translator'), container.resolve('translator'));
  });

  it('rejects an incomplete persistence override with a stable error', () => {
    assert.throws(
      () =>
        createApplicationContainer({
          organizationRegistrationFacts: {
            async findById() {
              return undefined;
            },
          },
        }),
      (error: unknown) =>
        error instanceof ApplicationPersistenceConfigurationError &&
        error.code === 'application.persistence.dependencies_incomplete',
    );
  });
});
