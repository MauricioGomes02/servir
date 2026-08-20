import { OrganizationIdErrorCodes } from '@/modules/organizations/domain';
import type { Mediator } from '@/shared/application/mediator';
import {
  requireHttpExecutionContext,
  sendPresentedProblem,
  type PresentedHttpProblem,
} from '@/shared/infrastructure/http/fastify';
import { presentedHttpProblemForCode } from '@/shared/infrastructure/http/problem-details';
import type { MessageTranslator, PresentedError } from '@/shared/presentation';
import type { FastifyInstance } from 'fastify';

import { CreateActivityMessage } from '../application';
import { ActivityCreationErrorCodes } from '../domain';
import type { CreateActivityPresenter } from '../presentation';

function property(source: unknown, key: string): unknown {
  return typeof source === 'object' && source !== null && key in source
    ? (source as Record<string, unknown>)[key]
    : undefined;
}

const organizationIdErrors = new Set<string>(Object.values(OrganizationIdErrorCodes));
function problemMetadata(error: PresentedError): PresentedHttpProblem {
  return presentedHttpProblemForCode(error.code, {
    invalidRequest: [...organizationIdErrors],
    resourceNotFound: [ActivityCreationErrorCodes.OrganizationNotFound],
    resourceConflict: [ActivityCreationErrorCodes.ActiveNameAlreadyExists],
  });
}

export function registerCreateActivityRoute(
  app: FastifyInstance,
  dependencies: {
    readonly mediator: Mediator;
    readonly presenter: CreateActivityPresenter;
    readonly messageTranslator: MessageTranslator;
  },
): void {
  app.post('/organizations/:organizationId/activities', async (request, reply) => {
    const context = requireHttpExecutionContext(request.executionContext);
    const result = await dependencies.mediator.send(
      CreateActivityMessage,
      {
        organizationId: property(request.params, 'organizationId'),
        name: property(request.body, 'name'),
        ministryIds: property(request.body, 'ministryIds'),
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
        `/organizations/${encodeURIComponent(view.resource.organizationId)}/activities/${encodeURIComponent(view.resource.id)}`,
      )
      .send(view.resource);
  });
}
