import type { FastifyInstance } from 'fastify';
import { supportedQuerySuffix, type ApiForwarder } from '../../shared/api-forwarder.js';

interface OrganizationParameters {
  readonly organizationId: string;
}

interface MemberParameters extends OrganizationParameters {
  readonly memberId: string;
}

interface MemberListQuery {
  readonly page?: string;
  readonly pageSize?: string;
  readonly search?: string;
  readonly status?: string;
}

const listFilters = ['page', 'pageSize', 'search', 'status'] as const;

export function registerMemberRoutes(app: FastifyInstance, forward: ApiForwarder): void {
  app.get<{ Params: OrganizationParameters; Querystring: MemberListQuery }>(
    '/bff/organizations/:organizationId/members',
    (request, reply) =>
      forward(
        request,
        reply,
        `/organizations/${encodeURIComponent(request.params.organizationId)}/members${supportedQuerySuffix(request.query, listFilters)}`,
      ),
  );
  app.post<{ Params: OrganizationParameters }>(
    '/bff/organizations/:organizationId/members',
    (request, reply) =>
      forward(
        request,
        reply,
        `/organizations/${encodeURIComponent(request.params.organizationId)}/members`,
      ),
  );
  app.get<{ Params: MemberParameters }>(
    '/bff/organizations/:organizationId/members/:memberId',
    (request, reply) =>
      forward(
        request,
        reply,
        `/organizations/${encodeURIComponent(request.params.organizationId)}/members/${encodeURIComponent(request.params.memberId)}`,
      ),
  );
}
