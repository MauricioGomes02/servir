import {
  AcceptMemberAccessInvitationErrorCodes,
  AcceptMemberAccessInvitationMessage,
  InviteMemberToAccessErrorCodes,
  InviteMemberToAccessMessage,
} from '../application';
import type {
  AcceptMemberAccessInvitationPresenter,
  InviteMemberToAccessPresenter,
} from '../presentation';
import { MemberIdErrorCodes } from '@/modules/membership/domain';
import { OrganizationIdErrorCodes } from '@/modules/organizations/domain';
import type { Mediator } from '@/shared/application/mediator';
import {
  requireHttpExecutionContext,
  sendPresentedProblem,
  type PresentedHttpProblem,
} from '@/shared/infrastructure/http/fastify';
import {
  presentedHttpProblemForCode,
  PresentedHttpProblemKinds,
} from '@/shared/infrastructure/http/problem-details';
import type { MessageTranslator, PresentedError } from '@/shared/presentation';
import type { FastifyInstance } from 'fastify';

export interface MemberAccessInvitationRouteDependencies {
  readonly acceptPresenter: AcceptMemberAccessInvitationPresenter;
  readonly invitePresenter: InviteMemberToAccessPresenter;
  readonly mediator: Mediator;
  readonly messageTranslator: MessageTranslator;
}

function property(input: unknown, name: string): unknown {
  return typeof input === 'object' && input !== null && name in input
    ? (input as Record<string, unknown>)[name]
    : undefined;
}

const idErrorCodes = [
  ...Object.values(OrganizationIdErrorCodes),
  ...Object.values(MemberIdErrorCodes),
];

function inviteProblem(error: PresentedError): PresentedHttpProblem {
  return presentedHttpProblemForCode(error.code, {
    authenticationRequired: [InviteMemberToAccessErrorCodes.AuthenticatedActorRequired],
    authorizationDenied: [InviteMemberToAccessErrorCodes.Forbidden],
    invalidRequest: idErrorCodes,
    resourceConflict: [InviteMemberToAccessErrorCodes.MemberAlreadyLinked],
    resourceNotFound: [InviteMemberToAccessErrorCodes.MemberUnavailable],
  });
}

function acceptProblem(error: PresentedError): PresentedHttpProblem {
  return presentedHttpProblemForCode(error.code, {
    authenticationRequired: [AcceptMemberAccessInvitationErrorCodes.AuthenticatedActorRequired],
    resourceConflict: [
      AcceptMemberAccessInvitationErrorCodes.InvitationAlreadyConsumed,
      AcceptMemberAccessInvitationErrorCodes.InvitationExpired,
      AcceptMemberAccessInvitationErrorCodes.InvitationRevoked,
      AcceptMemberAccessInvitationErrorCodes.AccessInactive,
      AcceptMemberAccessInvitationErrorCodes.MemberFromDifferentOrganization,
      AcceptMemberAccessInvitationErrorCodes.MemberAlreadyLinked,
      AcceptMemberAccessInvitationErrorCodes.UserAlreadyLinkedToAnotherMember,
    ],
    resourceNotFound: [
      AcceptMemberAccessInvitationErrorCodes.InvitationNotFound,
      AcceptMemberAccessInvitationErrorCodes.MemberUnavailable,
    ],
    fallback: PresentedHttpProblemKinds.InvalidRequest,
  });
}

export function registerMemberAccessInvitationRoutes(
  app: FastifyInstance,
  dependencies: MemberAccessInvitationRouteDependencies,
): void {
  app.post(
    '/organizations/:organizationId/members/:memberId/access-invitations',
    async (request, reply) => {
      const context = requireHttpExecutionContext(request.executionContext);
      const result = await dependencies.mediator.send(
        InviteMemberToAccessMessage,
        {
          memberId: property(request.params, 'memberId'),
          organizationId: property(request.params, 'organizationId'),
        },
        context,
      );
      const view = dependencies.invitePresenter.present(result, context, request.locale);
      if (view.kind === 'failure') {
        return sendPresentedProblem(reply, {
          context,
          error: view.error,
          errors: view.errors,
          locale: request.locale,
          problem: inviteProblem(view.error),
          translator: dependencies.messageTranslator,
        });
      }
      return reply.status(201).send(view.resource);
    },
  );

  app.post('/identity/member-access-invitations/accept', async (request, reply) => {
    const context = requireHttpExecutionContext(request.executionContext);
    const result = await dependencies.mediator.send(
      AcceptMemberAccessInvitationMessage,
      { token: property(request.body, 'token') },
      context,
    );
    const view = dependencies.acceptPresenter.present(result, context, request.locale);
    if (view.kind === 'failure') {
      return sendPresentedProblem(reply, {
        context,
        error: view.error,
        errors: view.errors,
        locale: request.locale,
        problem: acceptProblem(view.error),
        translator: dependencies.messageTranslator,
      });
    }
    return reply.status(200).send(view.resource);
  });
}
