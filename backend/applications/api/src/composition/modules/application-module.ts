import type { FastifyInstance } from 'fastify';
import type { ApplicationContainer } from '../container';
import type { CreateApplicationOptions } from '../create-application-options';

export interface ApplicationModule {
  register(container: ApplicationContainer, options: CreateApplicationOptions): void;
  registerRoutes(app: FastifyInstance, container: ApplicationContainer): void;
}
