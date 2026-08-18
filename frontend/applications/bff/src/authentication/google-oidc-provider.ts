import * as oidc from 'openid-client';
import type {
  OidcLoginTransaction,
  OidcProvider,
  VerifiedExternalIdentity,
} from './oidc-provider.js';
import { BffAuthenticationError, BffAuthenticationErrorCodes } from './authentication-error.js';

export interface GoogleOidcProviderConfig {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly redirectUri: URL;
}

export class GoogleOidcProvider implements OidcProvider {
  private constructor(
    private readonly config: GoogleOidcProviderConfig,
    private readonly client: oidc.Configuration,
  ) {}

  static async create(config: GoogleOidcProviderConfig): Promise<GoogleOidcProvider> {
    const client = await oidc.discovery(
      new URL('https://accounts.google.com'),
      config.clientId,
      config.clientSecret,
    );
    return new GoogleOidcProvider(config, client);
  }

  async createAuthorizationUrl(transaction: OidcLoginTransaction): Promise<URL> {
    return oidc.buildAuthorizationUrl(this.client, {
      client_id: this.config.clientId,
      code_challenge: await oidc.calculatePKCECodeChallenge(transaction.codeVerifier),
      code_challenge_method: 'S256',
      nonce: transaction.nonce,
      redirect_uri: this.config.redirectUri.href,
      response_type: 'code',
      scope: 'openid',
      state: transaction.state,
    });
  }

  async verifyCallback(
    callbackUrl: URL,
    transaction: OidcLoginTransaction,
  ): Promise<VerifiedExternalIdentity> {
    let tokens;
    try {
      tokens = await oidc.authorizationCodeGrant(this.client, callbackUrl, {
        expectedNonce: transaction.nonce,
        expectedState: transaction.state,
        pkceCodeVerifier: transaction.codeVerifier,
      });
    } catch (error) {
      throw new BffAuthenticationError(BffAuthenticationErrorCodes.CallbackInvalid, {
        cause: error,
      });
    }
    const claims = tokens.claims();
    if (claims === undefined) {
      throw new BffAuthenticationError(BffAuthenticationErrorCodes.ProviderResponseInvalid);
    }
    return Object.freeze({ issuer: claims.iss, subject: claims.sub });
  }
}
