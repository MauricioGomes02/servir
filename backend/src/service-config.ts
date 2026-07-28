import {
  ServiceConfigError,
  ServiceConfigErrorCodes,
} from './service-config-error';

const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_PORT = 3000;

export interface ServiceConfig {
  readonly host: string;
  readonly port: number;
}

export function readServiceConfig(
  environment: NodeJS.ProcessEnv,
): ServiceConfig {
  const host = environment.HOST?.trim() ?? DEFAULT_HOST;

  if (host.length === 0) {
    throw new ServiceConfigError(ServiceConfigErrorCodes.InvalidHost);
  }

  const portInput = environment.PORT?.trim();
  const port = portInput === undefined || portInput.length === 0
    ? DEFAULT_PORT
    : Number(portInput);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new ServiceConfigError(ServiceConfigErrorCodes.InvalidPort);
  }

  return Object.freeze({ host, port });
}
