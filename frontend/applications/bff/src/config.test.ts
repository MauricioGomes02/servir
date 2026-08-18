import { describe, expect, it } from 'vitest';
import { readBffConfig } from './config.js';
import { BffConfigError, BffConfigErrorCodes, type BffConfigErrorCode } from './config-error.js';

function expectConfigError(environment: NodeJS.ProcessEnv, code: BffConfigErrorCode): void {
  try {
    readBffConfig(environment);
    throw new Error('expected configuration to fail');
  } catch (error) {
    expect(error).toBeInstanceOf(BffConfigError);
    expect((error as BffConfigError).code).toBe(code);
  }
}

describe('readBffConfig', () => {
  it('requires the private api endpoint', () => {
    expectConfigError({}, BffConfigErrorCodes.InvalidApiBaseUrl);
  });

  it('applies safe listener defaults', () => {
    expect(readBffConfig({ API_BASE_URL: 'http://api:3000' })).toMatchObject({
      apiTimeoutMs: 10_000,
      host: '0.0.0.0',
      port: 3001,
    });
  });

  it('rejects a non-positive upstream timeout', () => {
    expectConfigError(
      { API_BASE_URL: 'http://api:3000', API_TIMEOUT_MS: '0' },
      BffConfigErrorCodes.InvalidApiTimeout,
    );
  });

  it('requires a complete signing configuration without a private-key default', () => {
    expectConfigError(
      { API_BASE_URL: 'http://api:3000', AUTH_KEY_ID: 'current-key' },
      BffConfigErrorCodes.AuthenticationIncomplete,
    );

    expect(
      readBffConfig({
        API_BASE_URL: 'http://api:3000',
        AUTH_AUDIENCE: 'servir-api',
        AUTH_COOKIE_ENCRYPTION_KEY: 'cookie-key',
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
        AUTH_COOKIE_ENCRYPTION_KEY: 'cookie-key',
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

  it('requires complete Google OIDC configuration when enabled', () => {
    expectConfigError(
      { API_BASE_URL: 'http://api:3000', GOOGLE_OIDC_CLIENT_ID: 'client' },
      BffConfigErrorCodes.GoogleOidcIncomplete,
    );

    expect(
      readBffConfig({
        API_BASE_URL: 'http://api:3000',
        GOOGLE_OIDC_CLIENT_ID: 'client',
        GOOGLE_OIDC_CLIENT_SECRET: 'secret',
        GOOGLE_OIDC_REDIRECT_URI: 'https://servir.test/bff/auth/google/callback',
      }).googleOidc,
    ).toEqual({
      clientId: 'client',
      clientSecret: 'secret',
      redirectUri: new URL('https://servir.test/bff/auth/google/callback'),
    });
  });
});
