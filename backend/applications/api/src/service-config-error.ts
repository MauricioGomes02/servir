export const ServiceConfigErrorCodes = {
  InvalidHost: 'service.configuration.host.invalid',
  InvalidPort: 'service.configuration.port.invalid',
  InvalidPersistenceMode: 'service.configuration.persistence_mode.invalid',
  InvalidDatabaseUrl: 'service.configuration.database_url.invalid',
} as const;

export type ServiceConfigErrorCode =
  (typeof ServiceConfigErrorCodes)[keyof typeof ServiceConfigErrorCodes];

export class ServiceConfigError extends Error {
  constructor(readonly code: ServiceConfigErrorCode) {
    super(code);
    this.name = 'ServiceConfigError';
  }
}
