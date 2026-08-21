import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  AcceptMemberAccessInvitationErrorCodes,
  AcceptMemberAccessInvitationMessage,
  InviteMemberToAccessErrorCodes,
  InviteMemberToAccessMessage,
} from '../application';
import { MemberAccessInvitationId, OrganizationAccessId } from '../domain';
import {
  AcceptMemberAccessInvitationPresenter,
  identityMessageCatalog,
  InviteMemberToAccessPresenter,
} from '../presentation';
import { MemberId } from '@/modules/membership/domain';
import { OrganizationId } from '@/modules/organizations/domain';
import {
  createAuthenticatedActor,
  parseAuthenticatedUserId,
} from '@/shared/application/authentication';
import { parseCorrelationId, parseRequestId } from '@/shared/application/context';
import { failure, success } from '@/shared/core/result';
import { Instant } from '@/shared/domain/instant';
import { Mediator } from '@/shared/application/mediator';
import { createFastifyApplication, httpProblemMessageCatalog } from '@/shared/infrastructure/http';
import { SequenceIdGenerator } from '@/shared/infrastructure/id-generator';
import { InMemoryMessageTranslator } from '@/shared/infrastructure/localization';
import { InMemoryLogger } from '@/shared/infrastructure/logging';
import { registerMemberAccessInvitationRoutes } from './register-member-access-invitation-routes';
import { registerOrganizationAccessGuard } from './register-organization-access-guard';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  if (!result.success) throw new Error('invalid deterministic fixture');
  return result.value;
}

const translator = new InMemoryMessageTranslator({
  'pt-BR': { ...httpProblemMessageCatalog['pt-BR'], ...identityMessageCatalog['pt-BR'] },
  'en-US': { ...httpProblemMessageCatalog['en-US'], ...identityMessageCatalog['en-US'] },
});
const actor = createAuthenticatedActor(
  value(parseAuthenticatedUserId('0198f334-6dc5-7c20-9af1-91d7e599b101')),
);
const organizationId = value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599b102'));
const memberId = value(MemberId.create('0198f334-6dc5-7c20-9af1-91d7e599b103'));

function application(options: { authenticated?: boolean; hasAccess?: boolean } = {}) {
  const mediator = new Mediator();
  const app = createFastifyApplication({
    ...(options.authenticated
      ? {
          accessTokenVerifier: {
            async verify() {
              return success(actor);
            },
          },
        }
      : {}),
    correlationIdGenerator: new SequenceIdGenerator([
      value(parseCorrelationId('member-access-route-correlation')),
    ]),
    logger: new InMemoryLogger(),
    messageTranslator: translator,
    requestIdGenerator: new SequenceIdGenerator([
      value(parseRequestId('member-access-route-request')),
    ]),
  });
  if (options.authenticated) {
    registerOrganizationAccessGuard(
      app,
      {
        async hasActiveAccess() {
          return options.hasAccess ?? true;
        },
      },
      translator,
    );
  }
  registerMemberAccessInvitationRoutes(app, {
    acceptPresenter: new AcceptMemberAccessInvitationPresenter(translator),
    invitePresenter: new InviteMemberToAccessPresenter(translator),
    mediator,
    messageTranslator: translator,
  });
  return { app, mediator };
}

describe('member access invitation routes', () => {
  it('forbids invitation creation when the actor has no tenant access', async () => {
    const { app, mediator } = application({ authenticated: true, hasAccess: false });
    mediator.register(InviteMemberToAccessMessage, async () => {
      throw new Error('handler must not be called');
    });
    const response = await app.inject({
      method: 'POST',
      url: `/organizations/${organizationId.toString()}/members/${memberId.toString()}/access-invitations`,
      headers: { authorization: 'Bearer access-token' },
    });
    await app.close();
    assert.equal(response.statusCode, 403);
  });

  it('returns a raw token once for an authorized invitation request', async () => {
    const { app, mediator } = application({ authenticated: true, hasAccess: true });
    mediator.register(InviteMemberToAccessMessage, async (command, context) => {
      assert.deepEqual(command, {
        organizationId: organizationId.toString(),
        memberId: memberId.toString(),
      });
      assert.equal(context.actor?.userId, actor.userId);
      return success({
        expiresAt: value(Instant.create('2026-08-27T12:00:00.000Z')),
        invitationId: value(
          MemberAccessInvitationId.create('0198f334-6dc5-7c20-9af1-91d7e599b104'),
        ),
        rawToken: 'boundary-only-token',
      });
    });
    const response = await app.inject({
      method: 'POST',
      url: `/organizations/${organizationId.toString()}/members/${memberId.toString()}/access-invitations`,
      headers: { authorization: 'Bearer access-token' },
    });
    await app.close();
    assert.equal(response.statusCode, 201);
    assert.equal(response.json().token, 'boundary-only-token');
  });

  it('presents invitation failures in valid Brazilian Portuguese', async () => {
    const { app, mediator } = application({ authenticated: true, hasAccess: true });
    mediator.register(InviteMemberToAccessMessage, async () =>
      failure({ code: InviteMemberToAccessErrorCodes.MemberAlreadyLinked }),
    );
    const response = await app.inject({
      method: 'POST',
      url: `/organizations/${organizationId.toString()}/members/${memberId.toString()}/access-invitations`,
      headers: { authorization: 'Bearer access-token', 'accept-language': 'pt-BR' },
    });
    await app.close();

    assert.equal(response.statusCode, 409);
    assert.equal(response.json().errors[0].detail, 'Este membro já está vinculado a outra conta.');
    assert.equal(response.body.includes('Ã'), false);
  });

  it('requires authentication to accept an invitation', async () => {
    const { app, mediator } = application();
    mediator.register(AcceptMemberAccessInvitationMessage, async (_command, context) => {
      assert.equal(context.actor, undefined);
      return failure({
        code: AcceptMemberAccessInvitationErrorCodes.AuthenticatedActorRequired,
      });
    });
    const response = await app.inject({
      method: 'POST',
      url: '/identity/member-access-invitations/accept',
      payload: { token: 'presented-token' },
    });
    await app.close();
    assert.equal(response.statusCode, 401);
  });

  it('accepts only a token from the client and takes user identity from context', async () => {
    const { app, mediator } = application({ authenticated: true });
    mediator.register(AcceptMemberAccessInvitationMessage, async (command, context) => {
      assert.deepEqual(command, { token: 'presented-token' });
      assert.equal(context.actor?.userId, actor.userId);
      return success({
        accessId: value(OrganizationAccessId.create('0198f334-6dc5-7c20-9af1-91d7e599b105')),
        memberId,
        organizationId,
      });
    });
    const response = await app.inject({
      method: 'POST',
      url: '/identity/member-access-invitations/accept',
      headers: { authorization: 'Bearer access-token' },
      payload: { token: 'presented-token', userId: 'client-controlled-user' },
    });
    await app.close();
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().memberId, memberId.toString());
  });
});
