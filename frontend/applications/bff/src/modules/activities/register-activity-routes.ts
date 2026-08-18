import type { FastifyInstance } from 'fastify';
import { supportedQuerySuffix, type ApiForwarder } from '../../shared/api-forwarder.js';

interface OrganizationParameters {
  readonly organizationId: string;
}

interface ActivityParameters extends OrganizationParameters {
  readonly activityId: string;
}

interface ActivityListQuery {
  readonly page?: string;
  readonly pageSize?: string;
  readonly search?: string;
  readonly status?: string;
}

const listFilters = ['page', 'pageSize', 'search', 'status'] as const;

export function registerActivityRoutes(app: FastifyInstance, forward: ApiForwarder): void {
  app.get<{ Params: OrganizationParameters; Querystring: ActivityListQuery }>(
    '/bff/organizations/:organizationId/activities',
    (request, reply) =>
      forward(
        request,
        reply,
        `/organizations/${encodeURIComponent(request.params.organizationId)}/activities${supportedQuerySuffix(request.query, listFilters)}`,
      ),
  );
  app.post<{ Params: OrganizationParameters }>(
    '/bff/organizations/:organizationId/activities',
    (request, reply) =>
      forward(
        request,
        reply,
        `/organizations/${encodeURIComponent(request.params.organizationId)}/activities`,
      ),
  );
  app.get<{ Params: ActivityParameters }>(
    '/bff/organizations/:organizationId/activities/:activityId',
    (request, reply) =>
      forward(
        request,
        reply,
        `/organizations/${encodeURIComponent(request.params.organizationId)}/activities/${encodeURIComponent(request.params.activityId)}`,
      ),
  );
}
