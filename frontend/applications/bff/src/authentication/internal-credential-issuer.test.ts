import { exportJWK, generateKeyPair, jwtVerify } from 'jose';
import { describe, expect, it } from 'vitest';

import { InternalCredentialIssuer } from './internal-credential-issuer.js';

const NOW = 1_800_000_000;

async function fixture() {
  const pair = await generateKeyPair('RS256', { extractable: true });
  const privateJwk = await exportJWK(pair.privateKey);
  const issuer = await InternalCredentialIssuer.create(
    {
      accessTokenTtlSeconds: 300,
      algorithm: 'RS256',
      audience: 'servir-api',
      bootstrapAssertionTtlSeconds: 60,
      issuer: 'https://identity.servir.test',
      keyId: 'current-key',
      privateJwk,
      sessionAudience: 'servir-bff',
      sessionTtlSeconds: 28_800,
    },
    () => NOW,
  );
  return { issuer, publicKey: pair.publicKey };
}

describe('InternalCredentialIssuer', () => {
  it('issues a short access token for the internal user', async () => {
    const { issuer, publicKey } = await fixture();
    const token = await issuer.issueAccessToken('0198f334-6dc5-7c20-9af1-91d7e599e011');

    const result = await jwtVerify(token, publicKey, {
      audience: 'servir-api',
      currentDate: new Date(NOW * 1000),
      issuer: 'https://identity.servir.test',
    });

    expect(result.protectedHeader).toMatchObject({ alg: 'RS256', kid: 'current-key' });
    expect(result.payload).toMatchObject({
      exp: NOW + 300,
      iat: NOW,
      purpose: 'access',
      sub: '0198f334-6dc5-7c20-9af1-91d7e599e011',
    });
  });

  it('issues a shorter purpose-restricted bootstrap assertion', async () => {
    const { issuer, publicKey } = await fixture();
    const token = await issuer.issueBootstrapAssertion({
      issuer: 'https://accounts.example.com',
      subject: 'provider-user',
    });

    const result = await jwtVerify(token, publicKey, {
      audience: 'servir-api',
      currentDate: new Date(NOW * 1000),
      issuer: 'https://identity.servir.test',
    });

    expect(result.payload).toMatchObject({
      exp: NOW + 60,
      external_issuer: 'https://accounts.example.com',
      external_subject: 'provider-user',
      purpose: 'user-provisioning',
    });
    expect(result.payload.sub).toBeUndefined();
  });

  it('issues a session restricted to the BFF audience', async () => {
    const { issuer, publicKey } = await fixture();
    const token = await issuer.issueSessionToken(
      '0198f334-6dc5-7c20-9af1-91d7e599e011',
      'csrf-token',
    );

    const result = await jwtVerify(token, publicKey, {
      audience: 'servir-bff',
      currentDate: new Date(NOW * 1000),
      issuer: 'https://identity.servir.test',
    });
    expect(result.payload).toMatchObject({
      exp: NOW + 28_800,
      purpose: 'session',
      csrf: 'csrf-token',
      sub: '0198f334-6dc5-7c20-9af1-91d7e599e011',
    });
    await expect(issuer.verifySessionToken(token)).resolves.toEqual({
      csrfToken: 'csrf-token',
      userId: '0198f334-6dc5-7c20-9af1-91d7e599e011',
    });
  });
});
