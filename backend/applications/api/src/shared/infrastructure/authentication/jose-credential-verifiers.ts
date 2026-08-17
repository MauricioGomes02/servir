import {
  AuthenticationErrorCodes,
  createAuthenticatedActor,
  createExternalIdentityAssertion,
  parseAuthenticatedUserId,
  parseIdentityIssuer,
  parseIdentitySubject,
  type AccessTokenVerifier,
  type BootstrapAssertionVerifier,
  type AuthenticationError,
} from '@/shared/application/authentication';
import { failure, success, type Result } from '@/shared/core/result';
import { createLocalJWKSet, errors, jwtVerify, type JSONWebKeySet } from 'jose';

export interface CredentialVerificationConfig {
  readonly algorithm: 'RS256';
  readonly audience: string;
  readonly issuer: string;
  readonly jwks: JSONWebKeySet;
}

async function verify(
  token: string,
  config: CredentialVerificationConfig,
  purpose: 'access' | 'user-provisioning',
): Promise<Result<Readonly<Record<string, unknown>>, AuthenticationError>> {
  try {
    const result = await jwtVerify(token, createLocalJWKSet(config.jwks), {
      algorithms: [config.algorithm],
      audience: config.audience,
      issuer: config.issuer,
      requiredClaims: ['exp', 'iat', 'purpose'],
    });

    if (result.payload.purpose !== purpose) {
      return failure({
        code:
          purpose === 'access'
            ? AuthenticationErrorCodes.InvalidAccessToken
            : AuthenticationErrorCodes.InvalidBootstrapAssertion,
      });
    }

    return success(result.payload);
  } catch (error) {
    const expired = error instanceof errors.JWTExpired;
    return failure({
      code:
        purpose === 'access'
          ? expired
            ? AuthenticationErrorCodes.ExpiredAccessToken
            : AuthenticationErrorCodes.InvalidAccessToken
          : expired
            ? AuthenticationErrorCodes.ExpiredBootstrapAssertion
            : AuthenticationErrorCodes.InvalidBootstrapAssertion,
    });
  }
}

export class JoseAccessTokenVerifier implements AccessTokenVerifier {
  constructor(private readonly config: CredentialVerificationConfig) {}

  async verify(token: string): ReturnType<AccessTokenVerifier['verify']> {
    const verified = await verify(token, this.config, 'access');
    if (!verified.success) return verified;

    const userId = parseAuthenticatedUserId(verified.value.sub);
    if (!userId.success) {
      return failure({ code: AuthenticationErrorCodes.InvalidAccessToken });
    }

    return success(createAuthenticatedActor(userId.value));
  }
}

export class JoseBootstrapAssertionVerifier implements BootstrapAssertionVerifier {
  constructor(private readonly config: CredentialVerificationConfig) {}

  async verifyBootstrapAssertion(
    token: string,
  ): ReturnType<BootstrapAssertionVerifier['verifyBootstrapAssertion']> {
    const verified = await verify(token, this.config, 'user-provisioning');
    if (!verified.success) return verified;

    const issuer = parseIdentityIssuer(verified.value.external_issuer);
    const subject = parseIdentitySubject(verified.value.external_subject);
    if (!issuer.success || !subject.success) {
      return failure({ code: AuthenticationErrorCodes.InvalidBootstrapAssertion });
    }

    return success(
      createExternalIdentityAssertion({ issuer: issuer.value, subject: subject.value }),
    );
  }
}
