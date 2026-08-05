export class ApplicationPersistenceConfigurationError extends Error {
  readonly code = 'application.persistence.dependencies_incomplete';

  constructor() {
    super('Application persistence dependencies are incomplete');
    this.name = 'ApplicationPersistenceConfigurationError';
  }
}
