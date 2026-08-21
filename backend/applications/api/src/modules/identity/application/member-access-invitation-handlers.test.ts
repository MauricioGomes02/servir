import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createAuthenticatedActor,
  parseAuthenticatedUserId,
} from '@/shared/application/authentication';
import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { FixedClock } from '@/shared/infrastructure/clock';
import { Instant } from '@/shared/domain/instant';
import { MemberId } from '@/modules/membership/domain';
import { OrganizationId } from '@/modules/organizations/domain';
import {
  MemberAccessInvitation,
  MemberAccessInvitationErrorCodes,
  MemberAccessInvitationId,
  MemberAccessInvitationTokenDigest,
  OrganizationAccess,
  OrganizationAccessId,
  UserId,
} from '../domain';
import {
  AcceptMemberAccessInvitationErrorCodes,
  AcceptMemberAccessInvitationHandler,
} from './accept-member-access-invitation';
import {
  InviteMemberToAccessErrorCodes,
  InviteMemberToAccessHandler,
} from './invite-member-to-access';
import type { MemberAccessInvitationWriteScope } from './member-access-invitation-write-scope';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  if (!result.success) throw new Error('invalid deterministic fixture');
  return result.value;
}

const ids = {
  access: value(OrganizationAccessId.create('0198f334-6dc5-7c20-9af1-91d7e599a101')),
  otherAccess: value(OrganizationAccessId.create('0198f334-6dc5-7c20-9af1-91d7e599a102')),
  invitation: value(MemberAccessInvitationId.create('0198f334-6dc5-7c20-9af1-91d7e599a103')),
  member: value(MemberId.create('0198f334-6dc5-7c20-9af1-91d7e599a104')),
  otherMember: value(MemberId.create('0198f334-6dc5-7c20-9af1-91d7e599a105')),
  organization: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599a106')),
  otherOrganization: value(OrganizationId.create('0198f334-6dc5-7c20-9af1-91d7e599a107')),
};
const now = value(Instant.create('2026-08-20T12:00:00.000Z'));
const future = value(Instant.create('2026-08-27T12:00:00.000Z'));
const digest = value(MemberAccessInvitationTokenDigest.create('a'.repeat(64)));
const rawToken = 'raw-invitation-secret';
const actorUserId = value(parseAuthenticatedUserId('0198f334-6dc5-7c20-9af1-91d7e599a108'));
const otherActorUserId = value(parseAuthenticatedUserId('0198f334-6dc5-7c20-9af1-91d7e599a109'));
const context = createExecutionContext({
  actor: createAuthenticatedActor(actorUserId),
  correlationId: value(parseCorrelationId('member-access-invitation-test')),
});
const recipientContext = createExecutionContext({
  actor: createAuthenticatedActor(otherActorUserId),
  correlationId: value(parseCorrelationId('member-access-invitation-recipient-test')),
});

function invitation(options: { expired?: boolean; revoked?: boolean } = {}) {
  const created = MemberAccessInvitation.invite({
    expiresAt: options.expired ? value(Instant.create('2026-08-19T12:00:00.000Z')) : future,
    id: ids.invitation,
    memberId: ids.member,
    now: value(Instant.create('2026-08-18T12:00:00.000Z')),
    organizationId: ids.organization,
    tokenDigest: digest,
  });
  assert.equal(created.success, true);
  if (!created.success) throw new Error('invalid invitation fixture');
  if (options.revoked) assert.equal(created.value.revoke().success, true);
  return created.value;
}

function access(
  input: {
    accessId?: OrganizationAccessId;
    memberId?: MemberId;
    userId?: string;
  } = {},
) {
  const organizationAccess = OrganizationAccess.grantOwner({
    id: input.accessId ?? ids.access,
    organizationId: ids.organization,
    userId: value(UserId.create(input.userId ?? actorUserId)),
  });
  if (input.memberId !== undefined) {
    assert.equal(
      organizationAccess.linkMember({
        memberId: input.memberId,
        organizationId: ids.organization,
      }).success,
      true,
    );
  }
  return organizationAccess;
}

interface State {
  accesses: OrganizationAccess[];
  invitations: MemberAccessInvitation[];
  activeMembers: Set<string>;
  locks: string[];
  failInvitationSave?: boolean;
}

function memberKey(organizationId: OrganizationId, memberId: MemberId): string {
  return `${organizationId.toString()}/${memberId.toString()}`;
}

function scope(state: State): MemberAccessInvitationWriteScope {
  return {
    acceptanceLock: {
      async acquireInvitation(tokenDigest) {
        state.locks.push('invitation');
        return state.invitations.find((item) => item.tokenDigest.equals(tokenDigest))?.id ?? null;
      },
      async acquireMember() {
        state.locks.push('member');
      },
      async acquireUser() {
        state.locks.push('user');
      },
    },
    invitations: {
      async add(item) {
        state.invitations.push(item);
      },
      async findById(invitationId) {
        return state.invitations.find((item) => item.id.equals(invitationId)) ?? null;
      },
      async save() {
        if (state.failInvitationSave) throw new Error('simulated invitation save failure');
      },
    },
    linkingFacts: {
      async find({ memberId, organizationId, userId }) {
        return {
          accesses: state.accesses
            .filter(
              (item) =>
                item.organizationId.equals(organizationId) &&
                (item.userId.equals(userId) || item.memberId?.equals(memberId) === true),
            )
            .map((item) => ({
              accessId: item.id,
              ...(item.memberId === undefined ? {} : { memberId: item.memberId }),
              status: item.status,
              userId: item.userId,
            })),
          memberStatus: state.activeMembers.has(memberKey(organizationId, memberId))
            ? 'active'
            : null,
        };
      },
    },
    organizationAccesses: {
      async add(item) {
        state.accesses.push(item);
      },
      async findById(organizationId, accessId) {
        return (
          state.accesses.find(
            (item) => item.organizationId.equals(organizationId) && item.id.equals(accessId),
          ) ?? null
        );
      },
      async save() {},
    },
    outbox: { async add() {} },
  };
}

function unitOfWork(state: State): UnitOfWork<MemberAccessInvitationWriteScope> {
  return {
    async execute(work) {
      return work(scope(state));
    },
  };
}

function inviteHandler(state: State, clockNow = now) {
  return new InviteMemberToAccessHandler({
    clock: new FixedClock(clockNow),
    invitationIdGenerator: { generate: () => ids.invitation },
    tokenDigester: { digest: () => digest },
    tokenGenerator: { generate: () => rawToken },
    unitOfWork: unitOfWork(state),
  });
}

function acceptHandler(state: State, accessId = ids.access) {
  return new AcceptMemberAccessInvitationHandler({
    clock: new FixedClock(now),
    organizationAccessIdGenerator: { generate: () => accessId },
    tokenDigester: { digest: () => digest },
    unitOfWork: unitOfWork(state),
  });
}

function validState(): State {
  return {
    accesses: [],
    invitations: [],
    activeMembers: new Set([memberKey(ids.organization, ids.member)]),
    locks: [],
  };
}

describe('member access invitation flow', () => {
  it('links the authenticated recipient to the invited member without email data', async () => {
    const state = validState();
    state.accesses.push(access());

    const invited = await inviteHandler(state).handle(
      { organizationId: ids.organization.toString(), memberId: ids.member.toString() },
      context,
    );
    assert.equal(invited.success, true);
    if (!invited.success) return;

    const accepted = await acceptHandler(state, ids.otherAccess).handle(
      { token: invited.value.rawToken },
      recipientContext,
    );

    assert.equal(accepted.success, true);
    if (!accepted.success) return;
    assert.equal(accepted.value.memberId.equals(ids.member), true);
    assert.equal(state.invitations[0]?.status, 'accepted');
    assert.equal(state.accesses.length, 2);
    assert.equal(state.accesses[1]?.userId.toString(), otherActorUserId);
    assert.equal(state.accesses[1]?.memberId?.equals(ids.member), true);
    assert.deepEqual(state.locks, ['invitation', 'user', 'member']);
  });
});

describe('InviteMemberToAccessHandler', () => {
  it('returns the raw token once while persisting only its digest', async () => {
    const state = validState();
    state.accesses.push(access());
    const result = await inviteHandler(state).handle(
      { organizationId: ids.organization.toString(), memberId: ids.member.toString() },
      context,
    );
    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.value.rawToken, rawToken);
    assert.equal(state.invitations.length, 1);
    assert.equal(state.invitations[0]?.tokenDigest.toString(), 'a'.repeat(64));
    assert.notEqual(state.invitations[0]?.tokenDigest.toString(), rawToken);
  });

  it('rejects a member outside the requested organization', async () => {
    const state = validState();
    state.accesses.push(access());
    const result = await inviteHandler(state).handle(
      { organizationId: ids.otherOrganization.toString(), memberId: ids.member.toString() },
      context,
    );
    assert.deepEqual(result, {
      success: false,
      error: { code: InviteMemberToAccessErrorCodes.MemberUnavailable },
    });
    assert.equal(state.invitations.length, 0);
  });

  it('checks active organization access inside the write scope', async () => {
    const state = validState();
    const result = await inviteHandler(state).handle(
      { organizationId: ids.organization.toString(), memberId: ids.member.toString() },
      context,
    );
    assert.deepEqual(result, {
      success: false,
      error: { code: InviteMemberToAccessErrorCodes.Forbidden },
    });
    assert.equal(state.invitations.length, 0);
  });

  it('returns a coded failure when the expiration instant cannot be represented', async () => {
    const state = validState();
    state.accesses.push(access());
    const maximumInstant = value(Instant.create('+275760-09-13T00:00:00.000Z'));

    const result = await inviteHandler(state, maximumInstant).handle(
      { organizationId: ids.organization.toString(), memberId: ids.member.toString() },
      context,
    );

    assert.deepEqual(result, {
      success: false,
      error: {
        code: MemberAccessInvitationErrorCodes.ExpirationInvalid,
        field: 'expiresAt',
      },
    });
    assert.equal(state.invitations.length, 0);
  });
});

describe('AcceptMemberAccessInvitationHandler', () => {
  it('creates one linked access when the user has no previous access', async () => {
    const state = validState();
    state.invitations.push(invitation());
    const result = await acceptHandler(state).handle({ token: rawToken }, context);
    assert.equal(result.success, true);
    assert.equal(state.accesses.length, 1);
    assert.equal(state.accesses[0]?.memberId?.equals(ids.member), true);
  });

  it('links the existing owner access without creating a second access', async () => {
    const state = validState();
    const existing = access();
    state.accesses.push(existing);
    state.invitations.push(invitation());
    const result = await acceptHandler(state).handle({ token: rawToken }, context);
    assert.equal(result.success, true);
    assert.equal(state.accesses.length, 1);
    assert.equal(state.accesses[0]?.id.equals(ids.access), true);
    assert.equal(state.accesses[0]?.memberId?.equals(ids.member), true);
    assert.equal(state.accesses[0]?.role, 'owner');
    assert.equal(state.accesses[0]?.status, 'active');
  });

  it('rejects expired, revoked, and reused invitations', async () => {
    for (const [candidate, code] of [
      [invitation({ expired: true }), AcceptMemberAccessInvitationErrorCodes.InvitationExpired],
      [invitation({ revoked: true }), AcceptMemberAccessInvitationErrorCodes.InvitationRevoked],
    ] as const) {
      const state = validState();
      state.invitations.push(candidate);
      const result = await acceptHandler(state).handle({ token: rawToken }, context);
      assert.deepEqual(result, { success: false, error: { code } });
      assert.equal(state.accesses.length, 0);
    }

    const state = validState();
    state.invitations.push(invitation());
    assert.equal((await acceptHandler(state).handle({ token: rawToken }, context)).success, true);
    assert.deepEqual(await acceptHandler(state).handle({ token: rawToken }, context), {
      success: false,
      error: { code: AcceptMemberAccessInvitationErrorCodes.InvitationAlreadyConsumed },
    });
  });

  it('rejects a user already linked to another member', async () => {
    const state = validState();
    state.activeMembers.add(memberKey(ids.organization, ids.otherMember));
    state.accesses.push(access({ memberId: ids.otherMember }));
    state.invitations.push(invitation());
    const result = await acceptHandler(state).handle({ token: rawToken }, context);
    assert.deepEqual(result, {
      success: false,
      error: {
        code: AcceptMemberAccessInvitationErrorCodes.UserAlreadyLinkedToAnotherMember,
      },
    });
  });

  it('rejects a member already linked to another user', async () => {
    const state = validState();
    state.accesses.push(
      access({ accessId: ids.otherAccess, memberId: ids.member, userId: otherActorUserId }),
    );
    state.invitations.push(invitation());
    const result = await acceptHandler(state).handle({ token: rawToken }, context);
    assert.deepEqual(result, {
      success: false,
      error: { code: AcceptMemberAccessInvitationErrorCodes.MemberAlreadyLinked },
    });
  });

  it('does not expose or consume an invalid token', async () => {
    const state = validState();
    state.invitations.push(invitation());
    const result = await acceptHandler(state).handle({ token: '' }, context);
    assert.deepEqual(result, {
      success: false,
      error: { code: AcceptMemberAccessInvitationErrorCodes.InvitationNotFound },
    });
    assert.equal(state.invitations[0]?.status, 'pending');
  });

  it('propagates a persistence failure so the Unit of Work can roll back', async () => {
    const state = validState();
    state.failInvitationSave = true;
    state.invitations.push(invitation());
    await assert.rejects(
      acceptHandler(state).handle({ token: rawToken }, context),
      /simulated invitation save failure/,
    );
  });
});
