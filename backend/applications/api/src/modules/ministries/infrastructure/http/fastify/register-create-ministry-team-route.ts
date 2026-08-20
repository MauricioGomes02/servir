import type { Mediator } from '@/shared/application/mediator';
import {
  requireHttpExecutionContext,
  sendPresentedProblem,
} from '@/shared/infrastructure/http/fastify';
import { presentedHttpProblemForCode } from '@/shared/infrastructure/http/problem-details';
import type { MessageTranslator } from '@/shared/presentation';
import type { FastifyInstance } from 'fastify';
import { OrganizationIdErrorCodes } from '@/modules/organizations/domain';
import { CreateMinistryTeamMessage } from '../../../application';
import { MinistryIdErrorCodes, MinistryTeamCreationPolicyErrorCodes } from '../../../domain';
import type { CreateMinistryTeamPresenter } from '../../../presentation';
function property(source: unknown, key: string) {
  return typeof source === 'object' && source !== null
    ? (source as Record<string, unknown>)[key]
    : undefined;
}
const idErrorCodes = new Set<string>([
  ...Object.values(OrganizationIdErrorCodes),
  ...Object.values(MinistryIdErrorCodes),
]);
export function registerCreateMinistryTeamRoute(
  app: FastifyInstance,
  dependencies: {
    mediator: Mediator;
    presenter: CreateMinistryTeamPresenter;
    messageTranslator: MessageTranslator;
  },
): void {
  app.post(
    '/organizations/:organizationId/ministries/:ministryId/teams',
    async (request, reply) => {
      const context = requireHttpExecutionContext(request.executionContext);
      const result = await dependencies.mediator.send(
        CreateMinistryTeamMessage,
        {
          organizationId: property(request.params, 'organizationId'),
          ministryId: property(request.params, 'ministryId'),
          name: property(request.body, 'name'),
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
            invalidRequest: [...idErrorCodes],
            resourceNotFound: [MinistryTeamCreationPolicyErrorCodes.MinistryNotFound],
            resourceConflict: [MinistryTeamCreationPolicyErrorCodes.ActiveNameAlreadyExists],
          }),
          translator: dependencies.messageTranslator,
        });
      }
      return reply
        .status(201)
        .header(
          'location',
          `/organizations/${encodeURIComponent(view.resource.organizationId)}/ministries/${encodeURIComponent(view.resource.ministryId)}/teams/${encodeURIComponent(view.resource.id)}`,
        )
        .send(view.resource);
    },
  );
}
