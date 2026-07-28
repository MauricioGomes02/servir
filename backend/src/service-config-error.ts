export const ServiceConfigErrorCodes = {
  InvalidHost: 'service.configuration.host.invalid',
  InvalidPort: 'service.configuration.port.invalid',
} as const;

export type ServiceConfigErrorCode =
  (typeof ServiceConfigErrorCodes)[keyof typeof ServiceConfigErrorCodes];

export class ServiceConfigError extends Error {
  constructor(readonly code: ServiceConfigErrorCode) {
    super(code);
    this.name = 'ServiceConfigError';
  }
}
