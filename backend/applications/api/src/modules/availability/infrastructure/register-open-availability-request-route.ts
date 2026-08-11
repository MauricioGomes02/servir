import { MinistryTeamIdErrorCodes } from '@/modules/ministries/domain';
import { OrganizationIdErrorCodes } from '@/modules/organizations/domain';
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
import { OpenAvailabilityRequestMessage } from '../application';
import { AvailabilityRequestOpeningErrorCodes } from '../domain';
import type { OpenAvailabilityRequestPresenter } from '../presentation';

function property(source: unknown, key: string): unknown {
  return typeof source === 'object' && source !== null && key in source
    ? (source as Record<string, unknown>)[key]
    : undefined;
}
const invalidIdCodes = new Set<string>([
  ...Object.values(OrganizationIdErrorCodes),
  ...Object.values(MinistryTeamIdErrorCodes),
]);
function problemMetadata(error: PresentedError): PresentedHttpProblem {
  if (invalidIdCodes.has(error.code))
    return {
      status: 400,
      type: HttpProblemTypes.InvalidRequest,
      titleCode: HttpProblemMessageCodes.InvalidRequestTitle,
    };
  if (error.code === AvailabilityRequestOpeningErrorCodes.TeamNotActive)
    return {
      status: 404,
      type: HttpProblemTypes.ResourceNotFound,
      titleCode: HttpProblemMessageCodes.ResourceNotFoundTitle,
    };
  return {
    status: 422,
    type: HttpProblemTypes.ValidationError,
    titleCode: HttpProblemMessageCodes.ValidationErrorTitle,
  };
}

export function registerOpenAvailabilityRequestRoute(
  app: FastifyInstance,
  dependencies: {
    readonly mediator: Mediator;
    readonly presenter: OpenAvailabilityRequestPresenter;
    readonly messageTranslator: MessageTranslator;
  },
): void {
  app.post(
    '/organizations/:organizationId/ministry-teams/:ministryTeamId/availability-requests',
    async (request, reply) => {
      const context = requireHttpExecutionContext(request.executionContext);
      const result = await dependencies.mediator.send(
        OpenAvailabilityRequestMessage,
        {
          organizationId: property(request.params, 'organizationId'),
          ministryTeamId: property(request.params, 'ministryTeamId'),
          startDate: property(request.body, 'startDate'),
          endDate: property(request.body, 'endDate'),
          respondBy: property(request.body, 'respondBy'),
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
      return reply
        .status(201)
        .header(
          'location',
          `/organizations/${encodeURIComponent(view.resource.organizationId)}/ministry-teams/${encodeURIComponent(view.resource.ministryTeamId)}/availability-requests/${encodeURIComponent(view.resource.id)}`,
        )
        .send(view.resource);
    },
  );
}
