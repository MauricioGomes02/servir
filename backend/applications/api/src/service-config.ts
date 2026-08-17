import { ServiceConfigError, ServiceConfigErrorCodes } from './service-config-error';
import { parseLogLevel, type LogLevel } from '@/shared/application/logging';
import type { JSONWebKeySet } from 'jose';
import { readFileSync } from 'node:fs';

type ReadTextFile = (path: string) => string;

const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_PORT = 3000;

export type PersistenceConfig = Readonly<{
  mode: 'postgres';
  connectionString: string;
}>;

export interface ServiceConfig {
  readonly authentication?: Readonly<{
    algorithm: 'RS256';
    audience: string;
    issuer: string;
    jwks: JSONWebKeySet;
  }>;
  readonly host: string;
  readonly port: number;
  readonly persistence: PersistenceConfig;
  readonly logLevel: LogLevel;
}

function readAuthenticationConfig(
  environment: NodeJS.ProcessEnv,
  readTextFile: ReadTextFile,
): ServiceConfig['authentication'] {
  const values = [
    environment.AUTH_ISSUER,
    environment.AUTH_AUDIENCE,
    environment.AUTH_JWKS ?? environment.AUTH_JWKS_FILE,
  ];
  if (values.every((value) => value === undefined || value.trim() === '')) return undefined;

  const [issuer, audience] = values.map((value) => value?.trim());
  const jwksFile = environment.AUTH_JWKS_FILE?.trim();
  const inlineJwks = environment.AUTH_JWKS?.trim();
  if (!issuer || !audience || (!jwksFile && !inlineJwks)) {
    throw new ServiceConfigError(ServiceConfigErrorCodes.InvalidAuthenticationConfiguration);
  }

  try {
    const serializedJwks = jwksFile ? readTextFile(jwksFile) : inlineJwks;
    if (serializedJwks === undefined) throw new Error('authentication configuration incomplete');
    const jwks = JSON.parse(serializedJwks) as JSONWebKeySet;
    if (!Array.isArray(jwks.keys) || jwks.keys.length === 0) throw new Error('empty jwks');
    if (jwks.keys.some((key) => key.kid === undefined || key.kid.trim() === '')) {
      throw new Error('missing kid');
    }
    return Object.freeze({ algorithm: 'RS256' as const, audience, issuer, jwks });
  } catch {
    throw new ServiceConfigError(ServiceConfigErrorCodes.InvalidAuthenticationConfiguration);
  }
}

function readPersistenceConfig(environment: NodeJS.ProcessEnv): PersistenceConfig {
  const mode = environment.PERSISTENCE_MODE?.trim() ?? 'postgres';
  if (mode !== 'postgres') {
    throw new ServiceConfigError(ServiceConfigErrorCodes.InvalidPersistenceMode);
  }

  const connectionString = environment.DATABASE_URL?.trim();

  if (connectionString === undefined || connectionString.length === 0) {
    throw new ServiceConfigError(ServiceConfigErrorCodes.InvalidDatabaseUrl);
  }

  try {
    const url = new URL(connectionString);

    if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') {
      throw new Error('Unsupported database protocol');
    }
  } catch {
    throw new ServiceConfigError(ServiceConfigErrorCodes.InvalidDatabaseUrl);
  }

  return Object.freeze({
    mode,
    connectionString,
  });
}

export function readServiceConfig(
  environment: NodeJS.ProcessEnv,
  readTextFile: ReadTextFile = (path) => readFileSync(path, 'utf8'),
): ServiceConfig {
  const authentication = readAuthenticationConfig(environment, readTextFile);
  const host = environment.HOST?.trim() ?? DEFAULT_HOST;

  if (host.length === 0) {
    throw new ServiceConfigError(ServiceConfigErrorCodes.InvalidHost);
  }

  const portInput = environment.PORT?.trim();
  const port = portInput === undefined || portInput.length === 0 ? DEFAULT_PORT : Number(portInput);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new ServiceConfigError(ServiceConfigErrorCodes.InvalidPort);
  }

  const logLevel = parseLogLevel(environment.LOG_LEVEL);

  if (logLevel === undefined) {
    throw new ServiceConfigError(ServiceConfigErrorCodes.InvalidLogLevel);
  }

  return Object.freeze({
    ...(authentication === undefined ? {} : { authentication }),
    host,
    port,
    persistence: readPersistenceConfig(environment),
    logLevel,
  });
}
