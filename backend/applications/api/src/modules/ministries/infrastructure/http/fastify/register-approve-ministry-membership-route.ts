import type { Mediator } from '@/shared/application/mediator';
import {
  requireHttpExecutionContext,
  sendPresentedProblem,
  type PresentedHttpProblem,
} from '@/shared/infrastructure/http/fastify';
import {
  presentedHttpProblemForCode,
  PresentedHttpProblemKinds,
} from '@/shared/infrastructure/http/problem-details';
import type { MessageTranslator, PresentedError } from '@/shared/presentation';
import type { FastifyInstance } from 'fastify';
import {
  ApproveMinistryMembershipErrorCodes,
  ApproveMinistryMembershipMessage,
} from '../../../application';
import { MinistryMembershipApprovalErrorCodes } from '../../../domain';
import type { ApproveMinistryMembershipPresenter } from '../../../presentation';

function parameter(params: unknown, key: string): unknown {
  return typeof params === 'object' && params !== null
    ? (params as Record<string, unknown>)[key]
    : undefined;
}
function problemMetadata(error: PresentedError): PresentedHttpProblem {
  return presentedHttpProblemForCode(error.code, {
    resourceNotFound: [ApproveMinistryMembershipErrorCodes.MembershipNotFound],
    resourceConflict: [MinistryMembershipApprovalErrorCodes.NotRequested],
    fallback: PresentedHttpProblemKinds.InvalidRequest,
  });
}
export function registerApproveMinistryMembershipRoute(
  app: FastifyInstance,
  dependencies: {
    mediator: Mediator;
    presenter: ApproveMinistryMembershipPresenter;
    messageTranslator: MessageTranslator;
  },
): void {
  app.post(
    '/organizations/:organizationId/ministries/:ministryId/memberships/:membershipId/approval',
    async (request, reply) => {
      const context = requireHttpExecutionContext(request.executionContext);
      const result = await dependencies.mediator.send(
        ApproveMinistryMembershipMessage,
        {
          organizationId: parameter(request.params, 'organizationId'),
          ministryId: parameter(request.params, 'ministryId'),
          ministryMembershipId: parameter(request.params, 'membershipId'),
        },
        context,
      );
      const view = dependencies.presenter.present(result, context, request.locale);
      if (view.kind === 'failure')
        return sendPresentedProblem(reply, {
          context,
          error: view.error,
          errors: view.errors,
          locale: request.locale,
          problem: problemMetadata(view.error),
          translator: dependencies.messageTranslator,
        });
      return reply.status(200).send(view.resource);
    },
  );
}
