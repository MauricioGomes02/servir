import type { Mediator } from '@/shared/application/mediator';
import {
  requireHttpExecutionContext,
  sendPresentedProblem,
  type PresentedHttpProblem,
} from '@/shared/infrastructure/http/fastify';
import {
  HttpProblemMessageCodes,
  HttpProblemTypes,
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
  if (error.code === ApproveMinistryMembershipErrorCodes.MembershipNotFound)
    return {
      status: 404,
      type: HttpProblemTypes.ResourceNotFound,
      titleCode: HttpProblemMessageCodes.ResourceNotFoundTitle,
    };
  if (error.code === MinistryMembershipApprovalErrorCodes.NotRequested)
    return {
      status: 409,
      type: HttpProblemTypes.ResourceConflict,
      titleCode: HttpProblemMessageCodes.ResourceConflictTitle,
    };
  return {
    status: 400,
    type: HttpProblemTypes.InvalidRequest,
    titleCode: HttpProblemMessageCodes.InvalidRequestTitle,
  };
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
          locale: request.locale,
          problem: problemMetadata(view.error),
          translator: dependencies.messageTranslator,
        });
      return reply.status(200).send(view.resource);
    },
  );
}
