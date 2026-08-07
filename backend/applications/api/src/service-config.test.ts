import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ServiceConfigError, ServiceConfigErrorCodes } from './service-config-error';
import { readServiceConfig } from './service-config';

function config(environment: NodeJS.ProcessEnv = {}) {
  return readServiceConfig({
    DATABASE_URL: 'postgresql://runtime:secret@localhost:5432/servir',
    ...environment,
  });
}

describe('readServiceConfig', () => {
  it('uses PostgreSQL with safe network defaults', () => {
    assert.deepEqual(config(), {
      host: '0.0.0.0',
      port: 3000,
      persistence: {
        mode: 'postgres',
        connectionString: 'postgresql://runtime:secret@localhost:5432/servir',
      },
      logLevel: 'info',
    });
  });
  it('normalizes explicit host and port configuration', () => {
    const result = config({ HOST: ' 127.0.0.1 ', PORT: ' 8080 ' });
    assert.equal(result.host, '127.0.0.1');
    assert.equal(result.port, 8080);
  });
  it('requires a valid PostgreSQL URL', () => {
    for (const databaseUrl of [undefined, '', 'http://localhost/servir']) {
      assert.throws(
        () => config({ DATABASE_URL: databaseUrl }),
        (error) =>
          error instanceof ServiceConfigError &&
          error.code === ServiceConfigErrorCodes.InvalidDatabaseUrl,
      );
    }
  });
  it('rejects an unsupported persistence mode with a stable code', () => {
    assert.throws(
      () => config({ PERSISTENCE_MODE: 'memory' }),
      (error) =>
        error instanceof ServiceConfigError &&
        error.code === ServiceConfigErrorCodes.InvalidPersistenceMode,
    );
  });
  it('accepts the minimum and maximum network ports', () => {
    assert.equal(config({ PORT: '1' }).port, 1);
    assert.equal(config({ PORT: '65535' }).port, 65_535);
  });
  it('rejects an empty explicit host with a stable code', () => {
    assert.throws(
      () => config({ HOST: '   ' }),
      (error) =>
        error instanceof ServiceConfigError && error.code === ServiceConfigErrorCodes.InvalidHost,
    );
  });
  it('rejects every invalid port equivalence class with a stable code', () => {
    for (const port of ['0', '65536', '1.5', 'not-a-number']) {
      assert.throws(
        () => config({ PORT: port }),
        (error) =>
          error instanceof ServiceConfigError && error.code === ServiceConfigErrorCodes.InvalidPort,
      );
    }
  });
  it('normalizes a supported log level and rejects unsupported values', () => {
    assert.equal(config({ LOG_LEVEL: ' DEBUG ' }).logLevel, 'debug');
    assert.throws(
      () => config({ LOG_LEVEL: 'verbose' }),
      (error) =>
        error instanceof ServiceConfigError &&
        error.code === ServiceConfigErrorCodes.InvalidLogLevel,
    );
  });
});
