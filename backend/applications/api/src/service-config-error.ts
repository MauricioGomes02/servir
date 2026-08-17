export const ServiceConfigErrorCodes = {
  InvalidAuthenticationConfiguration: 'service.configuration.authentication.invalid',
  InvalidHost: 'service.configuration.host.invalid',
  InvalidPort: 'service.configuration.port.invalid',
  InvalidPersistenceMode: 'service.configuration.persistence_mode.invalid',
  InvalidDatabaseUrl: 'service.configuration.database_url.invalid',
  InvalidLogLevel: 'service.configuration.log_level.invalid',
} as const;

export type ServiceConfigErrorCode =
  (typeof ServiceConfigErrorCodes)[keyof typeof ServiceConfigErrorCodes];

export class ServiceConfigError extends Error {
  constructor(readonly code: ServiceConfigErrorCode) {
    super(code);
    this.name = 'ServiceConfigError';
  }
}
