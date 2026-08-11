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
import {
  QualifyMemberForMinistryRoleErrorCodes,
  QualifyMemberForMinistryRoleMessage,
} from '../../../application';
import { MinistryRoleQualificationErrorCodes } from '../../../domain';
import type { QualifyMemberForMinistryRolePresenter } from '../../../presentation';
function value(input: unknown, key: string) {
  return typeof input === 'object' && input !== null
    ? (input as Record<string, unknown>)[key]
    : undefined;
}
export function registerQualifyMemberForMinistryRoleRoute(
  app: FastifyInstance,
  dependencies: {
    mediator: Mediator;
    presenter: QualifyMemberForMinistryRolePresenter;
    messageTranslator: MessageTranslator;
  },
): void {
  app.post(
    '/organizations/:organizationId/ministries/:ministryId/memberships/:membershipId/role-qualifications',
    async (request, reply) => {
      const context = requireHttpExecutionContext(request.executionContext);
      const result = await dependencies.mediator.send(
        QualifyMemberForMinistryRoleMessage,
        {
          organizationId: value(request.params, 'organizationId'),
          ministryId: value(request.params, 'ministryId'),
          ministryMembershipId: value(request.params, 'membershipId'),
          ministryRoleId: value(request.body, 'ministryRoleId'),
        },
        context,
      );
      const view = dependencies.presenter.present(result, context, request.locale);
      if (view.kind === 'failure') {
        const conflict = Object.values(MinistryRoleQualificationErrorCodes).includes(
          view.error
            .code as (typeof MinistryRoleQualificationErrorCodes)[keyof typeof MinistryRoleQualificationErrorCodes],
        );
        return sendPresentedProblem(reply, {
          context,
          error: view.error,
          errors: view.errors,
          locale: request.locale,
          problem: {
            status:
              view.error.code === QualifyMemberForMinistryRoleErrorCodes.MembershipNotFound
                ? 404
                : conflict
                  ? 409
                  : 400,
            type:
              view.error.code === QualifyMemberForMinistryRoleErrorCodes.MembershipNotFound
                ? HttpProblemTypes.ResourceNotFound
                : conflict
                  ? HttpProblemTypes.ResourceConflict
                  : HttpProblemTypes.InvalidRequest,
            titleCode:
              view.error.code === QualifyMemberForMinistryRoleErrorCodes.MembershipNotFound
                ? HttpProblemMessageCodes.ResourceNotFoundTitle
                : conflict
                  ? HttpProblemMessageCodes.ResourceConflictTitle
                  : HttpProblemMessageCodes.InvalidRequestTitle,
          },
          translator: dependencies.messageTranslator,
        });
      }
      return reply.status(201).send(view.resource);
    },
  );
}
