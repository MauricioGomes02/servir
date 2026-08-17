export interface OidcLoginTransaction {
  readonly codeVerifier: string;
  readonly nonce: string;
  readonly state: string;
}

export interface VerifiedExternalIdentity {
  readonly issuer: string;
  readonly subject: string;
}

export interface OidcProvider {
  createAuthorizationUrl(transaction: OidcLoginTransaction): Promise<URL>;
  verifyCallback(
    callbackUrl: URL,
    transaction: OidcLoginTransaction,
  ): Promise<VerifiedExternalIdentity>;
}
