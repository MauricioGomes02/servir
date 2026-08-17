import { describe, expect, it } from 'vitest';
import { readBffConfig } from './config.js';

describe('readBffConfig', () => {
  it('requires the private api endpoint', () => {
    expect(() => readBffConfig({})).toThrow('API_BASE_URL is required');
  });

  it('applies safe listener defaults', () => {
    expect(readBffConfig({ API_BASE_URL: 'http://api:3000' })).toMatchObject({
      apiTimeoutMs: 10_000,
      host: '0.0.0.0',
      port: 3001,
    });
  });

  it('rejects a non-positive upstream timeout', () => {
    expect(() => readBffConfig({ API_BASE_URL: 'http://api:3000', API_TIMEOUT_MS: '0' })).toThrow(
      'API_TIMEOUT_MS must be a positive integer',
    );
  });

  it('requires a complete signing configuration without a private-key default', () => {
    expect(() =>
      readBffConfig({ API_BASE_URL: 'http://api:3000', AUTH_KEY_ID: 'current-key' }),
    ).toThrow('authentication configuration must be complete');

    expect(
      readBffConfig({
        API_BASE_URL: 'http://api:3000',
        AUTH_AUDIENCE: 'servir-api',
        AUTH_ISSUER: 'https://identity.servir.test',
        AUTH_KEY_ID: 'current-key',
        AUTH_PRIVATE_JWK: JSON.stringify({ kty: 'RSA', d: 'private-component' }),
      }).authentication,
    ).toMatchObject({
      accessTokenTtlSeconds: 300,
      bootstrapAssertionTtlSeconds: 60,
      keyId: 'current-key',
    });
  });

  it('loads a mounted private key once with precedence over the inline value', () => {
    const paths: string[] = [];
    const result = readBffConfig(
      {
        API_BASE_URL: 'http://api:3000',
        AUTH_AUDIENCE: 'servir-api',
        AUTH_ISSUER: 'https://identity.servir.test',
        AUTH_KEY_ID: 'current-key',
        AUTH_PRIVATE_JWK: 'invalid-inline-value',
        AUTH_PRIVATE_JWK_FILE: '/run/secrets/auth-private-jwk',
      },
      (path) => {
        paths.push(path);
        return JSON.stringify({ kty: 'RSA', d: 'private-component' });
      },
    );

    expect(paths).toEqual(['/run/secrets/auth-private-jwk']);
    expect(result.authentication?.privateJwk.d).toBe('private-component');
  });
});
