import type { FastifyInstance } from 'fastify';
import type { ApiForwarder } from '../../shared/api-forwarder.js';

interface OrganizationParameters {
  readonly organizationId: string;
}

export function registerOrganizationRoutes(app: FastifyInstance, forward: ApiForwarder): void {
  app.post('/bff/organizations', (request, reply) => forward(request, reply, '/organizations'));
  app.get('/bff/organizations', (request, reply) => forward(request, reply, '/organizations'));
  app.get<{ Params: OrganizationParameters }>(
    '/bff/organizations/:organizationId',
    (request, reply) =>
      forward(
        request,
        reply,
        `/organizations/${encodeURIComponent(request.params.organizationId)}`,
      ),
  );
}
