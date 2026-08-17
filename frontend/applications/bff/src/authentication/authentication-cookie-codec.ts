import { base64url, EncryptJWT, jwtDecrypt } from 'jose';

export interface LoginTransaction {
  readonly codeVerifier: string;
  readonly nonce: string;
  readonly returnPath: string;
  readonly state: string;
}

export interface AuthenticationCookieCodecConfig {
  readonly encryptionKey: string;
  readonly issuer: string;
  readonly loginTransactionTtlSeconds: number;
}

export class AuthenticationCookieCodec {
  private readonly encryptionKey: Uint8Array;

  constructor(
    private readonly config: AuthenticationCookieCodecConfig,
    private readonly now: () => number = () => Math.floor(Date.now() / 1000),
  ) {
    this.encryptionKey = base64url.decode(config.encryptionKey);
    if (this.encryptionKey.byteLength !== 32) {
      throw new Error('authentication cookie encryption key must contain 32 bytes');
    }
  }

  get loginTransactionTtlSeconds(): number {
    return this.config.loginTransactionTtlSeconds;
  }

  encryptLoginTransaction(transaction: LoginTransaction): Promise<string> {
    const issuedAt = this.now();
    return new EncryptJWT({ ...transaction, purpose: 'oidc-login' })
      .setProtectedHeader({ alg: 'dir', enc: 'A256GCM', typ: 'JWT' })
      .setIssuer(this.config.issuer)
      .setAudience('servir-bff-login')
      .setIssuedAt(issuedAt)
      .setExpirationTime(issuedAt + this.config.loginTransactionTtlSeconds)
      .encrypt(this.encryptionKey);
  }

  async decryptLoginTransaction(token: string): Promise<LoginTransaction> {
    const { payload } = await jwtDecrypt(token, this.encryptionKey, {
      audience: 'servir-bff-login',
      contentEncryptionAlgorithms: ['A256GCM'],
      currentDate: new Date(this.now() * 1_000),
      issuer: this.config.issuer,
      keyManagementAlgorithms: ['dir'],
    });
    const { codeVerifier, nonce, purpose, returnPath, state } = payload;
    if (
      purpose !== 'oidc-login' ||
      typeof codeVerifier !== 'string' ||
      typeof nonce !== 'string' ||
      typeof returnPath !== 'string' ||
      typeof state !== 'string'
    ) {
      throw new Error('invalid oidc login transaction');
    }
    return Object.freeze({ codeVerifier, nonce, returnPath, state });
  }
}
