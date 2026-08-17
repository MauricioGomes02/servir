import type { JWK } from 'jose';
import { readFileSync } from 'node:fs';

type ReadTextFile = (path: string) => string;

export interface BffConfig {
  readonly authentication?: Readonly<{
    accessTokenTtlSeconds: number;
    algorithm: 'RS256';
    audience: string;
    bootstrapAssertionTtlSeconds: number;
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
  if (values.some((value) => !value)) throw new Error(`${configurationName} configuration must be complete`);
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
  if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`);
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
    environment.AUTH_PRIVATE_JWK ?? environment.AUTH_PRIVATE_JWK_FILE,
  ];
  if (values.every((value) => value === undefined || value.trim() === '')) return undefined;
  const [issuer, audience, keyId] = values.map((value) => value?.trim());
  const privateJwkFile = environment.AUTH_PRIVATE_JWK_FILE?.trim();
  const inlinePrivateJwk = environment.AUTH_PRIVATE_JWK?.trim();
  if (!issuer || !audience || !keyId || (!privateJwkFile && !inlinePrivateJwk)) {
    throw new Error('authentication configuration must be complete');
  }
  let privateJwk: JWK;
  try {
    const serializedJwk = privateJwkFile ? readTextFile(privateJwkFile) : inlinePrivateJwk;
    if (serializedJwk === undefined) throw new Error('authentication configuration incomplete');
    privateJwk = JSON.parse(serializedJwk) as JWK;
  } catch {
    throw new Error('AUTH_PRIVATE_JWK must be valid JSON');
  }
  if (privateJwk.d === undefined) throw new Error('AUTH_PRIVATE_JWK must contain a private key');
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
    issuer,
    keyId,
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
  if (!apiBaseUrl) throw new Error('API_BASE_URL is required');
  const port = Number(environment.PORT ?? '3001');
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error('PORT must be valid');
  const apiTimeoutMs = Number(environment.API_TIMEOUT_MS ?? '10000');
  if (!Number.isInteger(apiTimeoutMs) || apiTimeoutMs < 1)
    throw new Error('API_TIMEOUT_MS must be a positive integer');
  return {
    ...(authentication === undefined ? {} : { authentication }),
    ...(googleOidc === undefined ? {} : { googleOidc }),
    apiBaseUrl: new URL(apiBaseUrl),
    apiTimeoutMs,
    host: environment.HOST ?? '0.0.0.0',
    port,
  };
}
