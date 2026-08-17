import { base64url } from 'jose';
import { describe, expect, it } from 'vitest';
import { AuthenticationCookieCodec } from './authentication-cookie-codec.js';

const encryptionKey = base64url.encode(new Uint8Array(32).fill(7));
const transaction = {
  codeVerifier: 'verifier',
  nonce: 'nonce',
  returnPath: '/organizations/current',
  state: 'state',
};

describe('AuthenticationCookieCodec', () => {
  it('round-trips an encrypted login transaction', async () => {
    const codec = new AuthenticationCookieCodec(
      { encryptionKey, issuer: 'https://identity.servir.test', loginTransactionTtlSeconds: 300 },
      () => 1_000,
    );

    const token = await codec.encryptLoginTransaction(transaction);

    expect(token).not.toContain('verifier');
    await expect(codec.decryptLoginTransaction(token)).resolves.toEqual(transaction);
  });

  it('rejects an expired login transaction', async () => {
    let now = 1_000;
    const codec = new AuthenticationCookieCodec(
      { encryptionKey, issuer: 'https://identity.servir.test', loginTransactionTtlSeconds: 60 },
      () => now,
    );
    const token = await codec.encryptLoginTransaction(transaction);
    now = 1_061;

    await expect(codec.decryptLoginTransaction(token)).rejects.toThrow();
  });

  it('requires an A256GCM-sized encryption key', () => {
    expect(
      () =>
        new AuthenticationCookieCodec({
          encryptionKey: base64url.encode(new Uint8Array(31)),
          issuer: 'https://identity.servir.test',
          loginTransactionTtlSeconds: 300,
        }),
    ).toThrow('authentication cookie encryption key must contain 32 bytes');
  });
});
