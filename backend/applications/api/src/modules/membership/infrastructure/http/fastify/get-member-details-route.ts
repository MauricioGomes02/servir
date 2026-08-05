import {
  GetMemberDetailsErrorCodes,
  type GetMemberDetailsHandler,
} from '@/modules/membership/application';
import { MemberIdErrorCodes } from '@/modules/membership/domain';
import type { GetMemberDetailsPresenter } from '@/modules/membership/presentation';
import { OrganizationIdErrorCodes } from '@/modules/organizations/domain';
import {
  requireHttpExecutionContext,
  sendPresentedProblem,
  type PresentedHttpProblem,
} from '@/shared/infrastructure/http/fastify';
import {
  HttpProblemMessageCodes,
  HttpProblemTypes,
} from '@/shared/infrastructure/http/problem-details';
import { traceUseCase } from '@/shared/infrastructure/telemetry';
import type { MessageTranslator, PresentedError } from '@/shared/presentation';
import type { FastifyInstance } from 'fastify';

export interface GetMemberDetailsRouteDependencies {
  readonly handler: GetMemberDetailsHandler;
  readonly messageTranslator: MessageTranslator;
  readonly presenter: GetMemberDetailsPresenter;
}

function pathValue(params: unknown, name: string): unknown {
  return typeof params === 'object'
    && params !== null
    && name in params
    ? params[name as keyof typeof params]
    : undefined;
}

const invalidIdCodes = new Set<string>([
  ...Object.values(OrganizationIdErrorCodes),
  ...Object.values(MemberIdErrorCodes),
]);

function problemMetadata(error: PresentedError): PresentedHttpProblem {
  if (invalidIdCodes.has(error.code)) {
    return {
      status: 400,
      type: HttpProblemTypes.InvalidRequest,
      titleCode: HttpProblemMessageCodes.InvalidRequestTitle,
    };
  }

  if (error.code === GetMemberDetailsErrorCodes.NotFound) {
    return {
      status: 404,
      type: HttpProblemTypes.ResourceNotFound,
      titleCode: HttpProblemMessageCodes.ResourceNotFoundTitle,
    };
  }

  const unsupportedCode: never = error.code as never;
  return unsupportedCode;
}

export function registerGetMemberDetailsRoute(
  app: FastifyInstance,
  dependencies: GetMemberDetailsRouteDependencies,
): void {
  app.get(
    '/organizations/:organizationId/members/:memberId',
    async (request, reply) => {
      const context = requireHttpExecutionContext(request.executionContext);
      const result = await traceUseCase(
        'GetMemberDetails',
        () => dependencies.handler.handle({
          organizationId: pathValue(request.params, 'organizationId'),
          memberId: pathValue(request.params, 'memberId'),
        }, context),
      );
      const view = dependencies.presenter.present(
        result,
        context,
        request.locale,
      );

      if (view.kind === 'failure') {
        return sendPresentedProblem(reply, {
          context,
          error: view.error,
          locale: request.locale,
          problem: problemMetadata(view.error),
          translator: dependencies.messageTranslator,
        });
      }

      return reply.status(200).send(view.resource);
    },
  );
}
