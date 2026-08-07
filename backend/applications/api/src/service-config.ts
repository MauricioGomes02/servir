import { ServiceConfigError, ServiceConfigErrorCodes } from './service-config-error';
import { parseLogLevel, type LogLevel } from '@/shared/application/logging';

const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_PORT = 3000;

export type PersistenceConfig =
  | Readonly<{ mode: 'memory' }>
  | Readonly<{
      mode: 'postgres';
      connectionString: string;
    }>;

export interface ServiceConfig {
  readonly host: string;
  readonly port: number;
  readonly persistence: PersistenceConfig;
  readonly logLevel: LogLevel;
}

function readPersistenceConfig(environment: NodeJS.ProcessEnv): PersistenceConfig {
  const mode = environment.PERSISTENCE_MODE?.trim() ?? 'memory';

  if (mode === 'memory') {
    return Object.freeze({ mode });
  }

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

export function readServiceConfig(environment: NodeJS.ProcessEnv): ServiceConfig {
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
    host,
    port,
    persistence: readPersistenceConfig(environment),
    logLevel,
  });
}
