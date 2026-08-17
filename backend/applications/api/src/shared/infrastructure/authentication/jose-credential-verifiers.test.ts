import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AuthenticationErrorCodes } from '@/shared/application/authentication';
import { exportJWK, generateKeyPair, SignJWT, type CryptoKey, type JWK } from 'jose';

import {
  JoseAccessTokenVerifier,
  JoseBootstrapAssertionVerifier,
  type CredentialVerificationConfig,
} from '.';

const ISSUER = 'https://identity.servir.test';
const AUDIENCE = 'servir-api';
const USER_ID = '0198f334-6dc5-7c20-9af1-91d7e599e011';

async function keyPair(keyId: string): Promise<{ privateKey: CryptoKey; publicJwk: JWK }> {
  const pair = await generateKeyPair('RS256', { extractable: true });
  return {
    privateKey: pair.privateKey,
    publicJwk: { ...(await exportJWK(pair.publicKey)), alg: 'RS256', kid: keyId, use: 'sig' },
  };
}

function config(keys: readonly JWK[]): CredentialVerificationConfig {
  return { algorithm: 'RS256', audience: AUDIENCE, issuer: ISSUER, jwks: { keys: [...keys] } };
}

function sign(
  privateKey: CryptoKey,
  keyId: string,
  claims: Readonly<Record<string, string>>,
  options: { subject?: string; expiresAt?: number } = {},
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  let token = new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', kid: keyId })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(options.expiresAt ?? now + 60);
  if (options.subject !== undefined) token = token.setSubject(options.subject);
  return token.sign(privateKey);
}

describe('Internal credential verifiers', () => {
  it('validates an access token with the key selected by kid during rotation', async () => {
    const oldKey = await keyPair('old-key');
    const currentKey = await keyPair('current-key');
    const token = await sign(
      currentKey.privateKey,
      'current-key',
      { purpose: 'access' },
      {
        subject: USER_ID,
      },
    );

    const result = await new JoseAccessTokenVerifier(
      config([oldKey.publicJwk, currentKey.publicJwk]),
    ).verify(token);

    assert.deepEqual(result, { success: true, value: { userId: USER_ID } });
  });

  it('rejects an expired access token', async () => {
    const key = await keyPair('current-key');
    const token = await sign(
      key.privateKey,
      'current-key',
      { purpose: 'access' },
      {
        expiresAt: Math.floor(Date.now() / 1000) - 1,
        subject: USER_ID,
      },
    );

    assert.deepEqual(await new JoseAccessTokenVerifier(config([key.publicJwk])).verify(token), {
      success: false,
      error: { code: AuthenticationErrorCodes.ExpiredAccessToken },
    });
  });

  it('does not accept a bootstrap assertion as an access token', async () => {
    const key = await keyPair('current-key');
    const token = await sign(key.privateKey, 'current-key', {
      purpose: 'user-provisioning',
      external_issuer: 'https://accounts.example.com',
      external_subject: 'provider-user',
    });

    assert.deepEqual(await new JoseAccessTokenVerifier(config([key.publicJwk])).verify(token), {
      success: false,
      error: { code: AuthenticationErrorCodes.InvalidAccessToken },
    });
  });

  it('validates only a complete provisioning assertion', async () => {
    const key = await keyPair('current-key');
    const token = await sign(key.privateKey, 'current-key', {
      purpose: 'user-provisioning',
      external_issuer: 'https://accounts.example.com',
      external_subject: 'provider-user',
    });

    const result = await new JoseBootstrapAssertionVerifier(
      config([key.publicJwk]),
    ).verifyBootstrapAssertion(token);

    assert.deepEqual(result, {
      success: true,
      value: { issuer: 'https://accounts.example.com', subject: 'provider-user' },
    });
  });

  it('rejects a token signed by an unknown key', async () => {
    const trusted = await keyPair('trusted-key');
    const unknown = await keyPair('unknown-key');
    const token = await sign(
      unknown.privateKey,
      'unknown-key',
      { purpose: 'access' },
      {
        subject: USER_ID,
      },
    );

    assert.deepEqual(await new JoseAccessTokenVerifier(config([trusted.publicJwk])).verify(token), {
      success: false,
      error: { code: AuthenticationErrorCodes.InvalidAccessToken },
    });
  });
});
