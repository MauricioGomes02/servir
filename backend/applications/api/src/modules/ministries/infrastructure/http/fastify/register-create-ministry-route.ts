import type { CreateMinistryHandler } from '../../../application';
import { MinistryCreationPolicyErrorCodes } from '../../../domain';
import type { CreateMinistryPresenter } from '../../../presentation';
import { OrganizationIdErrorCodes } from '@/modules/organizations/domain';
import { requireHttpExecutionContext, sendPresentedProblem, type PresentedHttpProblem } from '@/shared/infrastructure/http/fastify';
import { HttpProblemMessageCodes, HttpProblemTypes } from '@/shared/infrastructure/http/problem-details';
import { traceUseCase } from '@/shared/infrastructure/telemetry';
import type { MessageTranslator, PresentedError } from '@/shared/presentation';
import type { FastifyInstance } from 'fastify';

export interface CreateMinistryRouteDependencies {
  readonly handler: CreateMinistryHandler;
  readonly presenter: CreateMinistryPresenter;
  readonly messageTranslator: MessageTranslator;
}

function property(source: unknown, key: string): unknown {
  return typeof source === 'object' && source !== null && key in source
    ? (source as Record<string, unknown>)[key]
    : undefined;
}

const organizationIdErrorCodes = new Set<string>(Object.values(OrganizationIdErrorCodes));
function problemMetadata(error: PresentedError): PresentedHttpProblem {
  if (organizationIdErrorCodes.has(error.code)) {
    return { status: 400, type: HttpProblemTypes.InvalidRequest, titleCode: HttpProblemMessageCodes.InvalidRequestTitle };
  }
  if (error.code === MinistryCreationPolicyErrorCodes.OrganizationNotFound) {
    return { status: 404, type: HttpProblemTypes.ResourceNotFound, titleCode: HttpProblemMessageCodes.ResourceNotFoundTitle };
  }
  if (error.code === MinistryCreationPolicyErrorCodes.ActiveNameAlreadyExists) {
    return { status: 409, type: HttpProblemTypes.ResourceConflict, titleCode: HttpProblemMessageCodes.ResourceConflictTitle };
  }
  return { status: 422, type: HttpProblemTypes.ValidationError, titleCode: HttpProblemMessageCodes.ValidationErrorTitle };
}

export function registerCreateMinistryRoute(app: FastifyInstance, dependencies: CreateMinistryRouteDependencies): void {
  app.post('/organizations/:organizationId/ministries', async (request, reply) => {
    const context = requireHttpExecutionContext(request.executionContext);
    const result = await traceUseCase('CreateMinistry', () => dependencies.handler.handle({
      organizationId: property(request.params, 'organizationId'),
      name: property(request.body, 'name'),
    }, context));
    const view = dependencies.presenter.present(result, context, request.locale);
    if (view.kind === 'failure') {
      return sendPresentedProblem(reply, {
        context,
        error: view.error,
        locale: request.locale,
        problem: problemMetadata(view.error),
        translator: dependencies.messageTranslator,
      });
    }
    return reply.status(201).header(
      'location',
      `/organizations/${encodeURIComponent(view.resource.organizationId)}/ministries/${encodeURIComponent(view.resource.id)}`,
    ).send(view.resource);
  });
}
