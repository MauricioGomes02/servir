import type { OrganizationAccessReader } from '../application';
import { UserId } from '../domain';
import { OrganizationId } from '@/modules/organizations/domain';
import { AuthenticationErrorCodes } from '@/shared/application/authentication';
import {
  requireHttpExecutionContext,
  sendExpectedProblem,
} from '@/shared/infrastructure/http/fastify';
import {
  presentedHttpProblem,
  PresentedHttpProblemKinds,
} from '@/shared/infrastructure/http/problem-details';
import type { MessageTranslator } from '@/shared/presentation';
import type { FastifyInstance } from 'fastify';

export const OrganizationAuthorizationErrorCode = 'identity.organization_access.forbidden';

function organizationIdParameter(params: unknown): unknown {
  if (typeof params !== 'object' || params === null || !('organizationId' in params)) {
    return undefined;
  }
  return params.organizationId;
}

export function registerOrganizationAccessGuard(
  app: FastifyInstance,
  accessReader: OrganizationAccessReader,
  messageTranslator: MessageTranslator,
): void {
  app.addHook('preHandler', async (request, reply) => {
    const rawOrganizationId = organizationIdParameter(request.params);
    if (rawOrganizationId === undefined) return;

    const context = requireHttpExecutionContext(request.executionContext);
    if (context.actor === undefined) {
      return sendExpectedProblem(reply, {
        context,
        error: { code: AuthenticationErrorCodes.MissingAccessToken },
        locale: request.locale,
        problem: presentedHttpProblem(PresentedHttpProblemKinds.AuthenticationRequired),
        translator: messageTranslator,
      });
    }

    const organizationId = OrganizationId.create(rawOrganizationId);
    const userId = UserId.create(context.actor.userId);
    if (
      !organizationId.success ||
      !userId.success ||
      !(await accessReader.hasActiveAccess(organizationId.value, userId.value))
    ) {
      return sendExpectedProblem(reply, {
        context,
        error: { code: OrganizationAuthorizationErrorCode },
        locale: request.locale,
        problem: presentedHttpProblem(PresentedHttpProblemKinds.AuthorizationDenied),
        translator: messageTranslator,
      });
    }
  });
}
