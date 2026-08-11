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
import { ScheduleManualActivityOccurrenceMessage } from '../application';
import { ActivityIdErrorCodes, ActivityOccurrenceSchedulingErrorCodes } from '../domain';
import type { ScheduleManualActivityOccurrencePresenter } from '../presentation';

function property(source: unknown, key: string): unknown {
  return typeof source === 'object' && source !== null && key in source
    ? (source as Record<string, unknown>)[key]
    : undefined;
}
const invalidIdCodes = new Set<string>([
  ...Object.values(OrganizationIdErrorCodes),
  ...Object.values(ActivityIdErrorCodes),
]);
function problemMetadata(error: PresentedError): PresentedHttpProblem {
  if (invalidIdCodes.has(error.code))
    return {
      status: 400,
      type: HttpProblemTypes.InvalidRequest,
      titleCode: HttpProblemMessageCodes.InvalidRequestTitle,
    };
  if (error.code === ActivityOccurrenceSchedulingErrorCodes.ActivityNotActive)
    return {
      status: 404,
      type: HttpProblemTypes.ResourceNotFound,
      titleCode: HttpProblemMessageCodes.ResourceNotFoundTitle,
    };
  if (error.code === ActivityOccurrenceSchedulingErrorCodes.ScheduledAtAlreadyExists)
    return {
      status: 409,
      type: HttpProblemTypes.ResourceConflict,
      titleCode: HttpProblemMessageCodes.ResourceConflictTitle,
    };
  return {
    status: 422,
    type: HttpProblemTypes.ValidationError,
    titleCode: HttpProblemMessageCodes.ValidationErrorTitle,
  };
}

export function registerScheduleManualActivityOccurrenceRoute(
  app: FastifyInstance,
  dependencies: {
    readonly mediator: Mediator;
    readonly presenter: ScheduleManualActivityOccurrencePresenter;
    readonly messageTranslator: MessageTranslator;
  },
): void {
  app.post(
    '/organizations/:organizationId/activities/:activityId/occurrences',
    async (request, reply) => {
      const context = requireHttpExecutionContext(request.executionContext);
      const result = await dependencies.mediator.send(
        ScheduleManualActivityOccurrenceMessage,
        {
          organizationId: property(request.params, 'organizationId'),
          activityId: property(request.params, 'activityId'),
          date: property(request.body, 'date'),
          time: property(request.body, 'time'),
          timeZoneId: property(request.body, 'timeZoneId'),
          disambiguation: property(request.body, 'disambiguation'),
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
          `/organizations/${encodeURIComponent(view.resource.organizationId)}/activities/${encodeURIComponent(view.resource.activityId)}/occurrences/${encodeURIComponent(view.resource.id)}`,
        )
        .send(view.resource);
    },
  );
}
