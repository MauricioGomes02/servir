import {
  requireHttpExecutionContext,
  sendPresentedProblem,
  type PresentedHttpProblem,
} from '@/shared/infrastructure/http/fastify';
import {
  presentedHttpProblemForCode,
  PresentedHttpProblemKinds,
} from '@/shared/infrastructure/http/problem-details';
import type { Mediator } from '@/shared/application/mediator';
import type { MessageTranslator, PresentedError } from '@/shared/presentation';
import type { FastifyInstance } from 'fastify';
import { RequestMinistryMembershipMessage } from '../../../application';
import { MinistryMembershipRequestPolicyErrorCodes } from '../../../domain';
import type { RequestMinistryMembershipPresenter } from '../../../presentation';

export interface RequestMinistryMembershipRouteDependencies {
  readonly mediator: Mediator;
  readonly presenter: RequestMinistryMembershipPresenter;
  readonly messageTranslator: MessageTranslator;
}
function parameter(params: unknown, key: 'organizationId' | 'ministryId'): unknown {
  if (typeof params !== 'object' || params === null) return undefined;
  return (params as Record<string, unknown>)[key];
}
function memberId(body: unknown): unknown {
  return typeof body === 'object' && body !== null && 'memberId' in body
    ? body.memberId
    : undefined;
}
function problemMetadata(error: PresentedError): PresentedHttpProblem {
  return presentedHttpProblemForCode(error.code, {
    resourceNotFound: [
      MinistryMembershipRequestPolicyErrorCodes.MemberNotFound,
      MinistryMembershipRequestPolicyErrorCodes.MinistryNotFound,
    ],
    resourceConflict: [MinistryMembershipRequestPolicyErrorCodes.CurrentMembershipAlreadyExists],
    fallback: PresentedHttpProblemKinds.InvalidRequest,
  });
}
export function registerRequestMinistryMembershipRoute(
  app: FastifyInstance,
  dependencies: RequestMinistryMembershipRouteDependencies,
): void {
  app.post(
    '/organizations/:organizationId/ministries/:ministryId/memberships',
    async (request, reply) => {
      const context = requireHttpExecutionContext(request.executionContext);
      const result = await dependencies.mediator.send(
        RequestMinistryMembershipMessage,
        {
          organizationId: parameter(request.params, 'organizationId'),
          ministryId: parameter(request.params, 'ministryId'),
          memberId: memberId(request.body),
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
          `/organizations/${encodeURIComponent(view.resource.organizationId)}/ministries/${encodeURIComponent(view.resource.ministryId)}/memberships/${encodeURIComponent(view.resource.id)}`,
        )
        .send(view.resource);
    },
  );
}
