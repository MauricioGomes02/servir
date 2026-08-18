import Fastify, { type FastifyInstance } from 'fastify';
import type { BffConfig } from './config.js';
import {
  registerGoogleAuthenticationRoutes,
  type GoogleAuthenticationRouteDependencies,
} from './authentication/register-google-authentication-routes.js';
import { registerSecurityHeaders } from './http/register-security.js';
import { registerSessionGuard } from './http/register-session-guard.js';
import { registerWebDelivery } from './http/register-web-delivery.js';
import { registerActivityRoutes } from './modules/activities/register-activity-routes.js';
import { registerMemberRoutes } from './modules/members/register-member-routes.js';
import { registerMinistryRoutes } from './modules/ministries/register-ministry-routes.js';
import { registerOrganizationRoutes } from './modules/organizations/register-organization-routes.js';
import { createApiForwarder } from './shared/api-forwarder.js';

export async function createApplication(
  config: BffConfig,
  options: {
    readonly googleAuthentication?: GoogleAuthenticationRouteDependencies;
    readonly logger?: boolean;
  } = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? true, bodyLimit: 32 * 1024 });

  registerSecurityHeaders(app);
  app.get('/health/live', () => ({ status: 'ok' }));

  if (options.googleAuthentication !== undefined) {
    await registerGoogleAuthenticationRoutes(app, options.googleAuthentication);
  }

  const accessTokenFor = registerSessionGuard(app, options.googleAuthentication);
  const forward = createApiForwarder(config, accessTokenFor);
  registerOrganizationRoutes(app, forward);
  registerMinistryRoutes(app, forward);
  registerMemberRoutes(app, forward);
  registerActivityRoutes(app, forward);

  await registerWebDelivery(app);
  return app;
}
