import type { Mediator } from '@/shared/application/mediator';
import {
  requireHttpExecutionContext,
  sendPresentedProblem,
} from '@/shared/infrastructure/http/fastify';
import {
  HttpProblemMessageCodes,
  HttpProblemTypes,
} from '@/shared/infrastructure/http/problem-details';
import type { MessageTranslator } from '@/shared/presentation';
import type { FastifyInstance } from 'fastify';
import { AssignMemberToTeamMessage } from '../../../application';
import { TeamMembershipAssignmentPolicyErrorCodes } from '../../../domain';
import type { AssignMemberToTeamPresenter } from '../../../presentation';
function property(source: unknown, key: string) {
  return typeof source === 'object' && source !== null
    ? (source as Record<string, unknown>)[key]
    : undefined;
}
export function registerAssignMemberToTeamRoute(
  app: FastifyInstance,
  dependencies: {
    mediator: Mediator;
    presenter: AssignMemberToTeamPresenter;
    messageTranslator: MessageTranslator;
  },
): void {
  app.post(
    '/organizations/:organizationId/ministries/:ministryId/teams/:teamId/memberships',
    async (request, reply) => {
      const context = requireHttpExecutionContext(request.executionContext);
      const result = await dependencies.mediator.send(
        AssignMemberToTeamMessage,
        {
          organizationId: property(request.params, 'organizationId'),
          ministryId: property(request.params, 'ministryId'),
          ministryTeamId: property(request.params, 'teamId'),
          ministryMembershipId: property(request.body, 'ministryMembershipId'),
        },
        context,
      );
      const view = dependencies.presenter.present(result, context, request.locale);
      if (view.kind === 'failure') {
        const missing = view.error.code === TeamMembershipAssignmentPolicyErrorCodes.TeamNotFound;
        const conflict =
          view.error.code ===
            TeamMembershipAssignmentPolicyErrorCodes.ActiveMembershipAlreadyExists ||
          view.error.code === TeamMembershipAssignmentPolicyErrorCodes.MinistryMembershipNotActive;
        return sendPresentedProblem(reply, {
          context,
          error: view.error,
          locale: request.locale,
          problem: {
            status: missing ? 404 : conflict ? 409 : 422,
            type: missing
              ? HttpProblemTypes.ResourceNotFound
              : conflict
                ? HttpProblemTypes.ResourceConflict
                : HttpProblemTypes.ValidationError,
            titleCode: missing
              ? HttpProblemMessageCodes.ResourceNotFoundTitle
              : conflict
                ? HttpProblemMessageCodes.ResourceConflictTitle
                : HttpProblemMessageCodes.ValidationErrorTitle,
          },
          translator: dependencies.messageTranslator,
        });
      }
      return reply.status(201).send(view.resource);
    },
  );
}
