import type { OrganizationAccessReader } from '../application';
import { UserId } from '../domain';
import { OrganizationId } from '@/modules/organizations/domain';
import {
  requireAuthenticatedActor,
  requireHttpExecutionContext,
} from '@/shared/infrastructure/http/fastify';
import type { FastifyInstance } from 'fastify';
import { HttpOrganizationAuthorizationError } from './http-organization-authorization-error';

function organizationIdParameter(params: unknown): unknown {
  if (typeof params !== 'object' || params === null || !('organizationId' in params)) {
    return undefined;
  }
  return params.organizationId;
}

export function registerOrganizationAccessGuard(
  app: FastifyInstance,
  accessReader: OrganizationAccessReader,
): void {
  app.addHook('preHandler', async (request) => {
    const rawOrganizationId = organizationIdParameter(request.params);
    if (rawOrganizationId === undefined) return;

    const context = requireHttpExecutionContext(request.executionContext);
    const actor = requireAuthenticatedActor(context);
    const organizationId = OrganizationId.create(rawOrganizationId);
    const userId = UserId.create(actor.userId);
    if (
      !organizationId.success ||
      !userId.success ||
      !(await accessReader.hasActiveAccess(organizationId.value, userId.value))
    ) {
      throw new HttpOrganizationAuthorizationError();
    }
  });
}
