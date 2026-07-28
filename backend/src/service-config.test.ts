import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ServiceConfigError,
  ServiceConfigErrorCodes,
} from './service-config-error';
import { readServiceConfig } from './service-config';

describe('readServiceConfig', () => {
  it('usa configuracao segura para desenvolvimento local', () => {
    assert.deepEqual(readServiceConfig({}), {
      host: '0.0.0.0',
      port: 3000,
    });
  });

  it('rejeita porta fora do intervalo de rede com codigo estavel', () => {
    assert.throws(
      () => readServiceConfig({ PORT: '70000' }),
      (error) => error instanceof ServiceConfigError
        && error.code === ServiceConfigErrorCodes.InvalidPort,
    );
  });
});
