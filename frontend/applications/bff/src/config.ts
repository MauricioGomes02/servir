import type { JWK } from 'jose';
import { readFileSync } from 'node:fs';
import { BffConfigError, BffConfigErrorCodes } from './config-error.js';

type ReadTextFile = (path: string) => string;

export interface BffConfig {
  readonly authentication?: Readonly<{
    accessTokenTtlSeconds: number;
    algorithm: 'RS256';
    audience: string;
    bootstrapAssertionTtlSeconds: number;
    cookieEncryptionKey: string;
    loginTransactionTtlSeconds: number;
    sessionAudience: string;
    sessionTtlSeconds: number;
    issuer: string;
    keyId: string;
    privateJwk: JWK;
  }>;
  readonly googleOidc?: Readonly<{
    clientId: string;
    clientSecret: string;
    redirectUri: URL;
  }>;
  readonly apiBaseUrl: URL;
  readonly apiTimeoutMs: number;
  readonly host: string;
  readonly port: number;
}

function requiredConfiguredValues<const Names extends readonly string[]>(
  environment: NodeJS.ProcessEnv,
  names: Names,
  configurationName: string,
): { readonly [Index in keyof Names]: string } | undefined {
  const values = names.map((name) => environment[name]?.trim());
  if (values.every((value) => !value)) return undefined;
  if (values.some((value) => !value)) {
    throw new BffConfigError(
      configurationName === 'google oidc'
        ? BffConfigErrorCodes.GoogleOidcIncomplete
        : BffConfigErrorCodes.AuthenticationIncomplete,
    );
  }
  return values as { readonly [Index in keyof Names]: string };
}

function readGoogleOidcConfig(environment: NodeJS.ProcessEnv): BffConfig['googleOidc'] {
  const values = requiredConfiguredValues(
    environment,
    ['GOOGLE_OIDC_CLIENT_ID', 'GOOGLE_OIDC_CLIENT_SECRET', 'GOOGLE_OIDC_REDIRECT_URI'] as const,
    'google oidc',
  );
  if (values === undefined) return undefined;
  const [clientId, clientSecret, redirectUri] = values;
  return Object.freeze({ clientId, clientSecret, redirectUri: new URL(redirectUri) });
}

function positiveInteger(input: string | undefined, fallback: number, name: string): number {
  const value = Number(input ?? String(fallback));
  if (!Number.isInteger(value) || value < 1) {
    throw new BffConfigError(BffConfigErrorCodes.InvalidPositiveInteger, {
      cause: Object.freeze({ name }),
    });
  }
  return value;
}

function readAuthenticationConfig(
  environment: NodeJS.ProcessEnv,
  readTextFile: ReadTextFile,
): BffConfig['authentication'] {
  const values = [
    environment.AUTH_ISSUER,
    environment.AUTH_AUDIENCE,
    environment.AUTH_KEY_ID,
    environment.AUTH_COOKIE_ENCRYPTION_KEY,
    environment.AUTH_PRIVATE_JWK ?? environment.AUTH_PRIVATE_JWK_FILE,
  ];
  if (values.every((value) => value === undefined || value.trim() === '')) return undefined;
  const [issuer, audience, keyId, cookieEncryptionKey] = values.map((value) => value?.trim());
  const privateJwkFile = environment.AUTH_PRIVATE_JWK_FILE?.trim();
  const inlinePrivateJwk = environment.AUTH_PRIVATE_JWK?.trim();
  if (
    !issuer ||
    !audience ||
    !keyId ||
    !cookieEncryptionKey ||
    (!privateJwkFile && !inlinePrivateJwk)
  ) {
    throw new BffConfigError(BffConfigErrorCodes.AuthenticationIncomplete);
  }
  let privateJwk: JWK;
  try {
    const serializedJwk = privateJwkFile ? readTextFile(privateJwkFile) : inlinePrivateJwk;
    if (serializedJwk === undefined) {
      throw new BffConfigError(BffConfigErrorCodes.AuthenticationIncomplete);
    }
    privateJwk = JSON.parse(serializedJwk) as JWK;
  } catch (error) {
    if (error instanceof BffConfigError) throw error;
    throw new BffConfigError(BffConfigErrorCodes.InvalidAuthenticationPrivateKeyFormat, {
      cause: error,
    });
  }
  if (privateJwk.d === undefined) {
    throw new BffConfigError(BffConfigErrorCodes.InvalidAuthenticationPrivateKey);
  }
  return Object.freeze({
    accessTokenTtlSeconds: positiveInteger(
      environment.AUTH_ACCESS_TOKEN_TTL_SECONDS,
      300,
      'AUTH_ACCESS_TOKEN_TTL_SECONDS',
    ),
    algorithm: 'RS256' as const,
    audience,
    bootstrapAssertionTtlSeconds: positiveInteger(
      environment.AUTH_BOOTSTRAP_TTL_SECONDS,
      60,
      'AUTH_BOOTSTRAP_TTL_SECONDS',
    ),
    cookieEncryptionKey,
    issuer,
    keyId,
    loginTransactionTtlSeconds: positiveInteger(
      environment.AUTH_LOGIN_TRANSACTION_TTL_SECONDS,
      300,
      'AUTH_LOGIN_TRANSACTION_TTL_SECONDS',
    ),
    sessionAudience: environment.AUTH_SESSION_AUDIENCE?.trim() || 'servir-bff',
    sessionTtlSeconds: positiveInteger(
      environment.AUTH_SESSION_TTL_SECONDS,
      28_800,
      'AUTH_SESSION_TTL_SECONDS',
    ),
    privateJwk,
  });
}

export function readBffConfig(
  environment: NodeJS.ProcessEnv,
  readTextFile: ReadTextFile = (path) => readFileSync(path, 'utf8'),
): BffConfig {
  const authentication = readAuthenticationConfig(environment, readTextFile);
  const googleOidc = readGoogleOidcConfig(environment);
  const apiBaseUrl = environment.API_BASE_URL;
  if (!apiBaseUrl) throw new BffConfigError(BffConfigErrorCodes.InvalidApiBaseUrl);
  const port = Number(environment.PORT ?? '3001');
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new BffConfigError(BffConfigErrorCodes.InvalidPort);
  }
  const apiTimeoutMs = Number(environment.API_TIMEOUT_MS ?? '10000');
  if (!Number.isInteger(apiTimeoutMs) || apiTimeoutMs < 1)
    throw new BffConfigError(BffConfigErrorCodes.InvalidApiTimeout);
  return {
    ...(authentication === undefined ? {} : { authentication }),
    ...(googleOidc === undefined ? {} : { googleOidc }),
    apiBaseUrl: new URL(apiBaseUrl),
    apiTimeoutMs,
    host: environment.HOST ?? '0.0.0.0',
    port,
  };
}
