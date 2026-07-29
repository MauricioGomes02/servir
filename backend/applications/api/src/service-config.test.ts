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
      persistence: {
        mode: 'memory',
      },
    });
  });

  it('normalizes explicit host and port configuration', () => {
    assert.deepEqual(readServiceConfig({
      HOST: ' 127.0.0.1 ',
      PORT: ' 8080 ',
    }), {
      host: '127.0.0.1',
      port: 8080,
      persistence: {
        mode: 'memory',
      },
    });
  });

  it('requires a PostgreSQL URL only in postgres mode', () => {
    assert.deepEqual(readServiceConfig({
      PERSISTENCE_MODE: ' postgres ',
      DATABASE_URL: ' postgresql://runtime:secret@localhost:5432/servir ',
    }).persistence, {
      mode: 'postgres',
      connectionString: 'postgresql://runtime:secret@localhost:5432/servir',
    });

    for (const databaseUrl of [undefined, '', 'http://localhost/servir']) {
      assert.throws(
        () => readServiceConfig({
          PERSISTENCE_MODE: 'postgres',
          DATABASE_URL: databaseUrl,
        }),
        (error) => error instanceof ServiceConfigError
          && error.code === ServiceConfigErrorCodes.InvalidDatabaseUrl,
      );
    }
  });

  it('rejects an unsupported persistence mode with a stable code', () => {
    assert.throws(
      () => readServiceConfig({ PERSISTENCE_MODE: 'mysql' }),
      (error) => error instanceof ServiceConfigError
        && error.code === ServiceConfigErrorCodes.InvalidPersistenceMode,
    );
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
