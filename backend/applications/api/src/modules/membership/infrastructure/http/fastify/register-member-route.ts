import type { RegisterMemberHandler } from '@/modules/membership/application';
import { MemberRegistrationPolicyErrorCodes } from '@/modules/membership/domain';
import type { RegisterMemberPresenter } from '@/modules/membership/presentation';
import { OrganizationIdErrorCodes } from '@/modules/organizations/domain';
import {
  HttpProblemMessageCodes,
  HttpProblemTypes,
} from '@/shared/infrastructure/http/problem-details';
import {
  requireHttpExecutionContext,
  sendPresentedProblem,
  type PresentedHttpProblem,
} from '@/shared/infrastructure/http/fastify';
import { traceUseCase } from '@/shared/infrastructure/telemetry';
import type { MessageTranslator, PresentedError } from '@/shared/presentation';
import type { FastifyInstance } from 'fastify';

export interface RegisterMemberRouteDependencies {
  readonly handler: RegisterMemberHandler;
  readonly messageTranslator: MessageTranslator;
  readonly presenter: RegisterMemberPresenter;
}

function organizationId(params: unknown): unknown {
  return typeof params === 'object' && params !== null && 'organizationId' in params
    ? params.organizationId
    : undefined;
}

function memberName(body: unknown): unknown {
  return typeof body === 'object' && body !== null && 'name' in body ? body.name : undefined;
}

const organizationIdErrorCodes = new Set<string>(Object.values(OrganizationIdErrorCodes));

function problemMetadata(error: PresentedError): PresentedHttpProblem {
  if (organizationIdErrorCodes.has(error.code)) {
    return {
      status: 400,
      type: HttpProblemTypes.InvalidRequest,
      titleCode: HttpProblemMessageCodes.InvalidRequestTitle,
    };
  }

  if (error.code === MemberRegistrationPolicyErrorCodes.OrganizationNotFound) {
    return {
      status: 404,
      type: HttpProblemTypes.ResourceNotFound,
      titleCode: HttpProblemMessageCodes.ResourceNotFoundTitle,
    };
  }

  return {
    status: 422,
    type: HttpProblemTypes.ValidationError,
    titleCode: HttpProblemMessageCodes.ValidationErrorTitle,
  };
}

export function registerMemberRoute(
  app: FastifyInstance,
  dependencies: RegisterMemberRouteDependencies,
): void {
  app.post('/organizations/:organizationId/members', async (request, reply) => {
    const context = requireHttpExecutionContext(request.executionContext);

    const result = await traceUseCase('RegisterMember', () =>
      dependencies.handler.handle(
        {
          organizationId: organizationId(request.params),
          name: memberName(request.body),
        },
        context,
      ),
    );
    const view = dependencies.presenter.present(result, context, request.locale);

    if (view.kind === 'failure') {
      const problem = problemMetadata(view.error);

      return sendPresentedProblem(reply, {
        context,
        error: view.error,
        locale: request.locale,
        problem,
        translator: dependencies.messageTranslator,
      });
    }

    return reply
      .status(201)
      .header(
        'location',
        `/organizations/${encodeURIComponent(view.resource.organizationId)}/members/${encodeURIComponent(view.resource.id)}`,
      )
      .send(view.resource);
  });
}
