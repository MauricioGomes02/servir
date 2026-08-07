import {
  requireHttpExecutionContext,
  sendPresentedProblem,
  type PresentedHttpProblem,
} from '@/shared/infrastructure/http/fastify';
import {
  HttpProblemMessageCodes,
  HttpProblemTypes,
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
  if (
    error.code === MinistryMembershipRequestPolicyErrorCodes.MemberNotFound ||
    error.code === MinistryMembershipRequestPolicyErrorCodes.MinistryNotFound
  )
    return {
      status: 404,
      type: HttpProblemTypes.ResourceNotFound,
      titleCode: HttpProblemMessageCodes.ResourceNotFoundTitle,
    };
  if (error.code === MinistryMembershipRequestPolicyErrorCodes.CurrentMembershipAlreadyExists)
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
