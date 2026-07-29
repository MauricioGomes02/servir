import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  IdSequenceExhaustedError,
  SequenceIdGenerator,
} from '.';

describe('SequenceIdGenerator', () => {
  it('generates identities in the configured order', () => {
    const ids = ['organization-1', 'organization-2'] as const;
    const generator = new SequenceIdGenerator(ids);

    assert.equal(generator.generate(), 'organization-1');
    assert.equal(generator.generate(), 'organization-2');
  });

  it('protects the received sequence from external mutation', () => {
    const ids = ['organization-1'];
    const generator = new SequenceIdGenerator(ids);

    ids[0] = 'organization-changed';

    assert.equal(generator.generate(), 'organization-1');
  });

  it('classifies exhaustion as a test configuration error', () => {
    const generator = new SequenceIdGenerator<string>([]);

    assert.throws(
      () => generator.generate(),
      (error: unknown) => {
        assert.equal(error instanceof IdSequenceExhaustedError, true);

        if (!(error instanceof IdSequenceExhaustedError)) {
          return false;
        }

        assert.equal(error.code, 'id_generator.sequence.exhausted');

        return true;
      },
    );
  });
});
