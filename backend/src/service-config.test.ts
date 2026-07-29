import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ServiceConfigError,
  ServiceConfigErrorCodes,
} from './service-config-error';
import { readServiceConfig } from './service-config';

describe('readServiceConfig', () => {
  it('uses safe defaults for local development', () => {
    assert.deepEqual(readServiceConfig({}), {
      host: '0.0.0.0',
      port: 3000,
    });
  });

  it('normalizes explicit host and port configuration', () => {
    assert.deepEqual(readServiceConfig({
      HOST: ' 127.0.0.1 ',
      PORT: ' 8080 ',
    }), {
      host: '127.0.0.1',
      port: 8080,
    });
  });

  it('accepts the minimum and maximum network ports', () => {
    assert.equal(readServiceConfig({ PORT: '1' }).port, 1);
    assert.equal(readServiceConfig({ PORT: '65535' }).port, 65_535);
  });

  it('rejects an empty explicit host with a stable code', () => {
    assert.throws(
      () => readServiceConfig({ HOST: '   ' }),
      (error) => error instanceof ServiceConfigError
        && error.code === ServiceConfigErrorCodes.InvalidHost,
    );
  });

  it('rejects every invalid port equivalence class with a stable code', () => {
    for (const port of ['0', '65536', '1.5', 'not-a-number']) {
      assert.throws(
        () => readServiceConfig({ PORT: port }),
        (error) => error instanceof ServiceConfigError
          && error.code === ServiceConfigErrorCodes.InvalidPort,
      );
    }
  });
});
