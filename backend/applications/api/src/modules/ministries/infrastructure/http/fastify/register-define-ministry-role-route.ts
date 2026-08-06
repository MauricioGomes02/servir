import { DefineMinistryRoleErrorCodes, type DefineMinistryRoleHandler } from '../../../application';
import { MinistryIdErrorCodes, MinistryRoleDefinitionErrorCodes } from '../../../domain';
import type { DefineMinistryRolePresenter } from '../../../presentation';
import { OrganizationIdErrorCodes } from '@/modules/organizations/domain';
import { requireHttpExecutionContext, sendPresentedProblem, type PresentedHttpProblem } from '@/shared/infrastructure/http/fastify';
import { HttpProblemMessageCodes, HttpProblemTypes } from '@/shared/infrastructure/http/problem-details';
import { traceUseCase } from '@/shared/infrastructure/telemetry';
import type { MessageTranslator, PresentedError } from '@/shared/presentation';
import type { FastifyInstance } from 'fastify';

function property(source: unknown, key: string): unknown {
  return typeof source === 'object' && source !== null && key in source ? (source as Record<string, unknown>)[key] : undefined;
}
const invalidIdCodes = new Set<string>([...Object.values(OrganizationIdErrorCodes), ...Object.values(MinistryIdErrorCodes)]);
function metadata(error: PresentedError): PresentedHttpProblem {
  if (invalidIdCodes.has(error.code)) return { status: 400, type: HttpProblemTypes.InvalidRequest, titleCode: HttpProblemMessageCodes.InvalidRequestTitle };
  if (error.code === DefineMinistryRoleErrorCodes.MinistryNotFound) return { status: 404, type: HttpProblemTypes.ResourceNotFound, titleCode: HttpProblemMessageCodes.ResourceNotFoundTitle };
  if (error.code === MinistryRoleDefinitionErrorCodes.ActiveNameAlreadyExists) return { status: 409, type: HttpProblemTypes.ResourceConflict, titleCode: HttpProblemMessageCodes.ResourceConflictTitle };
  return { status: 422, type: HttpProblemTypes.ValidationError, titleCode: HttpProblemMessageCodes.ValidationErrorTitle };
}
export function registerDefineMinistryRoleRoute(app: FastifyInstance, dependencies: {
  handler: DefineMinistryRoleHandler; presenter: DefineMinistryRolePresenter; messageTranslator: MessageTranslator;
}): void {
  app.post('/organizations/:organizationId/ministries/:ministryId/roles', async (request, reply) => {
    const context = requireHttpExecutionContext(request.executionContext);
    const result = await traceUseCase('DefineMinistryRole', () => dependencies.handler.handle({
      organizationId: property(request.params, 'organizationId'), ministryId: property(request.params, 'ministryId'),
      name: property(request.body, 'name'),
    }, context));
    const view = dependencies.presenter.present(result, context, request.locale);
    if (view.kind === 'failure') return sendPresentedProblem(reply, {
      context, error: view.error, locale: request.locale, problem: metadata(view.error), translator: dependencies.messageTranslator,
    });
    return reply.status(201).header('location',
      `/organizations/${encodeURIComponent(view.resource.organizationId)}/ministries/${encodeURIComponent(view.resource.ministryId)}/roles/${encodeURIComponent(view.resource.id)}`,
    ).send(view.resource);
  });
}
