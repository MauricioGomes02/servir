declare const serviceContract: unique symbol;

export interface ServiceToken<T> {
  readonly name: string;
  readonly [serviceContract]?: (value: T) => T;
}

export function defineService<T>(name: string): ServiceToken<T> {
  return Object.freeze({ name });
}

export class DuplicateServiceRegistrationError extends Error {
  readonly code = 'composition.service.duplicate';
  constructor(name: string) {
    super(`Service ${name} is already registered`);
    this.name = 'DuplicateServiceRegistrationError';
  }
}

export class UnregisteredServiceError extends Error {
  readonly code = 'composition.service.unregistered';
  constructor(name: string) {
    super(`Service ${name} is not registered`);
    this.name = 'UnregisteredServiceError';
  }
}

export class ServiceRegistry {
  private readonly values = new Map<string, unknown>();
  add<T>(token: ServiceToken<T>, value: T): void {
    if (this.values.has(token.name)) throw new DuplicateServiceRegistrationError(token.name);
    this.values.set(token.name, value);
  }
  get<T>(token: ServiceToken<T>): T {
    if (!this.values.has(token.name)) throw new UnregisteredServiceError(token.name);
    return this.values.get(token.name) as T;
  }
}
