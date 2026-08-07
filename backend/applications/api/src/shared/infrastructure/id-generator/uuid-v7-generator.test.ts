import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { OrganizationId } from '@/modules/organizations/domain';
import { failure } from '@/shared/core/result';

import { UuidV7Generator, UuidV7GeneratorError, UuidV7GeneratorErrorCodes } from '.';

const UUID_V7 = '0198f334-6dc5-7c20-9af1-91d7e599c7b1';

describe('UuidV7Generator', () => {
  it('produces a typed identity through the configured factory', () => {
    const generator = new UuidV7Generator(OrganizationId.create, () => UUID_V7);

    const id = generator.generate();

    assert.equal(id.toString(), UUID_V7);
  });

  it('classifies and preserves a source failure', () => {
    const sourceFailure = new Error('entropy unavailable');
    const generator = new UuidV7Generator(OrganizationId.create, () => {
      throw sourceFailure;
    });

    assert.throws(
      () => generator.generate(),
      (error: unknown) => {
        assert.equal(error instanceof UuidV7GeneratorError, true);

        if (!(error instanceof UuidV7GeneratorError)) {
          return false;
        }

        assert.equal(error.code, UuidV7GeneratorErrorCodes.SourceFailed);
        assert.equal(error.cause, sourceFailure);

        return true;
      },
    );
  });

  it('classifies and preserves a factory exception', () => {
    const factoryFailure = new Error('factory unavailable');
    const generator = new UuidV7Generator<OrganizationId, never>(
      () => {
        throw factoryFailure;
      },
      () => UUID_V7,
    );

    assert.throws(
      () => generator.generate(),
      (error: unknown) => {
        assert.equal(error instanceof UuidV7GeneratorError, true);

        if (!(error instanceof UuidV7GeneratorError)) {
          return false;
        }

        assert.equal(error.code, UuidV7GeneratorErrorCodes.IdFactoryFailed);
        assert.equal(error.cause, factoryFailure);

        return true;
      },
    );
  });

  it('classifies and preserves rejection of the generated value', () => {
    const rejection = {
      code: 'test.id.rejected',
    } as const;
    const generator = new UuidV7Generator(
      () => failure(rejection),
      () => UUID_V7,
    );

    assert.throws(
      () => generator.generate(),
      (error: unknown) => {
        assert.equal(error instanceof UuidV7GeneratorError, true);

        if (!(error instanceof UuidV7GeneratorError)) {
          return false;
        }

        assert.equal(error.code, UuidV7GeneratorErrorCodes.GeneratedIdRejected);
        assert.deepEqual(error.cause, rejection);

        return true;
      },
    );
  });
});
