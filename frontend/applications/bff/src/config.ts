export interface BffConfig {
  readonly apiBaseUrl: URL;
  readonly apiTimeoutMs: number;
  readonly host: string;
  readonly port: number;
}

export function readBffConfig(environment: NodeJS.ProcessEnv): BffConfig {
  const apiBaseUrl = environment.API_BASE_URL;
  if (!apiBaseUrl) throw new Error('API_BASE_URL is required');
  const port = Number(environment.PORT ?? '3001');
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error('PORT must be valid');
  const apiTimeoutMs = Number(environment.API_TIMEOUT_MS ?? '10000');
  if (!Number.isInteger(apiTimeoutMs) || apiTimeoutMs < 1)
    throw new Error('API_TIMEOUT_MS must be a positive integer');
  return {
    apiBaseUrl: new URL(apiBaseUrl),
    apiTimeoutMs,
    host: environment.HOST ?? '0.0.0.0',
    port,
  };
}
