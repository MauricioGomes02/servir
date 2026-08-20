import type { Mediator } from '@/shared/application/mediator';
import {
  requireHttpExecutionContext,
  sendPresentedProblem,
} from '@/shared/infrastructure/http/fastify';
import { presentedHttpProblemForCode } from '@/shared/infrastructure/http/problem-details';
import type { MessageTranslator } from '@/shared/presentation';
import type { FastifyInstance } from 'fastify';
import { AppointTeamLeaderMessage } from '../../../application';
import { TeamLeaderAppointmentPolicyErrorCodes } from '../../../domain';
import type { AppointTeamLeaderPresenter } from '../../../presentation';

function property(source: unknown, key: string) {
  return typeof source === 'object' && source !== null
    ? (source as Record<string, unknown>)[key]
    : undefined;
}

export function registerAppointTeamLeaderRoute(
  app: FastifyInstance,
  dependencies: {
    mediator: Mediator;
    presenter: AppointTeamLeaderPresenter;
    messageTranslator: MessageTranslator;
  },
): void {
  app.post(
    '/organizations/:organizationId/ministries/:ministryId/teams/:teamId/leadership',
    async (request, reply) => {
      const context = requireHttpExecutionContext(request.executionContext);
      const result = await dependencies.mediator.send(
        AppointTeamLeaderMessage,
        {
          organizationId: property(request.params, 'organizationId'),
          ministryId: property(request.params, 'ministryId'),
          ministryTeamId: property(request.params, 'teamId'),
          teamMembershipId: property(request.body, 'teamMembershipId'),
        },
        context,
      );
      const view = dependencies.presenter.present(result, context, request.locale);
      if (view.kind === 'failure') {
        return sendPresentedProblem(reply, {
          context,
          error: view.error,
          errors: view.errors,
          locale: request.locale,
          problem: presentedHttpProblemForCode(view.error.code, {
            resourceNotFound: [
              TeamLeaderAppointmentPolicyErrorCodes.TeamMembershipNotActive,
              TeamLeaderAppointmentPolicyErrorCodes.TeamNotActive,
            ],
            resourceConflict: [TeamLeaderAppointmentPolicyErrorCodes.ActiveLeadershipAlreadyExists],
          }),
          translator: dependencies.messageTranslator,
        });
      }
      return reply.status(201).send(view.resource);
    },
  );
}
