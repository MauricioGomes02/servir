import { importJWK, SignJWT, type JWK } from 'jose';

export interface InternalCredentialIssuerConfig {
  readonly algorithm: 'RS256';
  readonly audience: string;
  readonly issuer: string;
  readonly keyId: string;
  readonly privateJwk: JWK;
  readonly accessTokenTtlSeconds: number;
  readonly bootstrapAssertionTtlSeconds: number;
  readonly sessionAudience: string;
  readonly sessionTtlSeconds: number;
}

export interface ExternalIdentityAssertionInput {
  readonly issuer: string;
  readonly subject: string;
}

export class InternalCredentialIssuer {
  private constructor(
    private readonly config: InternalCredentialIssuerConfig,
    private readonly signingKey: CryptoKey,
    private readonly now: () => number,
  ) {}

  static async create(
    config: InternalCredentialIssuerConfig,
    now: () => number = () => Math.floor(Date.now() / 1000),
  ): Promise<InternalCredentialIssuer> {
    const signingKey = await importJWK(config.privateJwk, config.algorithm);
    if (!(signingKey instanceof CryptoKey)) throw new Error('authentication.signing_key.invalid');
    return new InternalCredentialIssuer(config, signingKey, now);
  }

  issueAccessToken(userId: string): Promise<string> {
    return this.sign({ purpose: 'access' }, this.config.accessTokenTtlSeconds, userId);
  }

  issueBootstrapAssertion(identity: ExternalIdentityAssertionInput): Promise<string> {
    return this.sign(
      {
        purpose: 'user-provisioning',
        external_issuer: identity.issuer,
        external_subject: identity.subject,
      },
      this.config.bootstrapAssertionTtlSeconds,
    );
  }

  issueSessionToken(userId: string): Promise<string> {
    return this.sign(
      { purpose: 'session' },
      this.config.sessionTtlSeconds,
      userId,
      this.config.sessionAudience,
    );
  }

  private sign(
    claims: Readonly<Record<string, string>>,
    ttlSeconds: number,
    subject?: string,
    audience: string = this.config.audience,
  ): Promise<string> {
    const issuedAt = this.now();
    let token = new SignJWT(claims)
      .setProtectedHeader({ alg: this.config.algorithm, kid: this.config.keyId, typ: 'JWT' })
      .setIssuer(this.config.issuer)
      .setAudience(audience)
      .setIssuedAt(issuedAt)
      .setExpirationTime(issuedAt + ttlSeconds);
    if (subject !== undefined) token = token.setSubject(subject);
    return token.sign(this.signingKey);
  }
}
