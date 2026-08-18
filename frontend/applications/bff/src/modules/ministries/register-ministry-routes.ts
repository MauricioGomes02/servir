import type { FastifyInstance } from 'fastify';
import { supportedQuerySuffix, type ApiForwarder } from '../../shared/api-forwarder.js';

interface OrganizationParameters {
  readonly organizationId: string;
}

interface MinistryParameters extends OrganizationParameters {
  readonly ministryId: string;
}

interface MinistryListQuery {
  readonly page?: string;
  readonly pageSize?: string;
  readonly search?: string;
  readonly status?: string;
}

const listFilters = ['page', 'pageSize', 'search', 'status'] as const;

export function registerMinistryRoutes(app: FastifyInstance, forward: ApiForwarder): void {
  app.get<{ Params: OrganizationParameters; Querystring: MinistryListQuery }>(
    '/bff/organizations/:organizationId/ministries',
    (request, reply) =>
      forward(
        request,
        reply,
        `/organizations/${encodeURIComponent(request.params.organizationId)}/ministries${supportedQuerySuffix(request.query, listFilters)}`,
      ),
  );
  app.post<{ Params: OrganizationParameters }>(
    '/bff/organizations/:organizationId/ministries',
    (request, reply) =>
      forward(
        request,
        reply,
        `/organizations/${encodeURIComponent(request.params.organizationId)}/ministries`,
      ),
  );
  app.get<{ Params: MinistryParameters }>(
    '/bff/organizations/:organizationId/ministries/:ministryId',
    (request, reply) =>
      forward(
        request,
        reply,
        `/organizations/${encodeURIComponent(request.params.organizationId)}/ministries/${encodeURIComponent(request.params.ministryId)}`,
      ),
  );
  app.post<{ Params: MinistryParameters }>(
    '/bff/organizations/:organizationId/ministries/:ministryId/roles',
    (request, reply) =>
      forward(
        request,
        reply,
        `/organizations/${encodeURIComponent(request.params.organizationId)}/ministries/${encodeURIComponent(request.params.ministryId)}/roles`,
      ),
  );
}
