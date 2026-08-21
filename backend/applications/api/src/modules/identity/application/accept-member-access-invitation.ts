import type { MemberId } from '@/modules/membership/domain';
import type { OrganizationId } from '@/modules/organizations/domain';
import type { Clock } from '@/shared/application/clock';
import type { ExecutionContext } from '@/shared/application/context';
import type { IdGenerator } from '@/shared/application/id-generator';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { failure, success, type Result } from '@/shared/core/result';

import {
  MemberAccessInvitationErrorCodes,
  OrganizationAccess,
  OrganizationAccessLinkErrorCodes,
  OrganizationAccessStatuses,
  type OrganizationAccessId,
  UserId,
} from '../domain';
import type { MemberAccessInvitationTokenDigester } from './member-access-invitation-token';
import type { MemberAccessInvitationWriteScope } from './member-access-invitation-write-scope';

const MAX_PRESENTED_TOKEN_LENGTH = 512;

export const AcceptMemberAccessInvitationErrorCodes = {
  AccessInactive: OrganizationAccessLinkErrorCodes.InactiveAccess,
  AuthenticatedActorRequired: 'identity.member_access_invitation.authenticated_actor_required',
  InvitationAlreadyConsumed: MemberAccessInvitationErrorCodes.AlreadyConsumed,
  InvitationExpired: MemberAccessInvitationErrorCodes.Expired,
  InvitationNotFound: 'identity.member_access_invitation.not_found',
  InvitationRevoked: MemberAccessInvitationErrorCodes.Revoked,
  MemberFromDifferentOrganization: OrganizationAccessLinkErrorCodes.DifferentOrganization,
  MemberAlreadyLinked: 'identity.member_access_invitation.member_already_linked',
  MemberUnavailable: 'identity.member_access_invitation.member_unavailable',
  UserAlreadyLinkedToAnotherMember:
    OrganizationAccessLinkErrorCodes.UserAlreadyLinkedToAnotherMember,
} as const;

export type AcceptMemberAccessInvitationError = Readonly<{
  code: (typeof AcceptMemberAccessInvitationErrorCodes)[keyof typeof AcceptMemberAccessInvitationErrorCodes];
}>;

export interface AcceptMemberAccessInvitationCommand {
  readonly token: unknown;
}

export interface AcceptMemberAccessInvitationOutput {
  readonly accessId: OrganizationAccessId;
  readonly memberId: MemberId;
  readonly organizationId: OrganizationId;
}

export interface AcceptMemberAccessInvitationDependencies {
  readonly clock: Clock;
  readonly organizationAccessIdGenerator: IdGenerator<OrganizationAccessId>;
  readonly tokenDigester: MemberAccessInvitationTokenDigester;
  readonly unitOfWork: UnitOfWork<MemberAccessInvitationWriteScope>;
}

function presentedToken(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  const token = input.trim();
  return token.length > 0 && token.length <= MAX_PRESENTED_TOKEN_LENGTH ? token : undefined;
}

export class AcceptMemberAccessInvitationHandler {
  constructor(private readonly dependencies: AcceptMemberAccessInvitationDependencies) {}

  async handle(
    command: AcceptMemberAccessInvitationCommand,
    context: ExecutionContext,
  ): Promise<Result<AcceptMemberAccessInvitationOutput, AcceptMemberAccessInvitationError>> {
    const userId = UserId.create(context.actor?.userId);
    if (!userId.success) {
      return failure({ code: AcceptMemberAccessInvitationErrorCodes.AuthenticatedActorRequired });
    }
    const rawToken = presentedToken(command.token);
    if (rawToken === undefined) {
      return failure({ code: AcceptMemberAccessInvitationErrorCodes.InvitationNotFound });
    }
    const tokenDigest = this.dependencies.tokenDigester.digest(rawToken);
    const now = this.dependencies.clock.now();

    return this.dependencies.unitOfWork.execute(async (scope) => {
      const invitationId = await scope.acceptanceLock.acquireInvitation(tokenDigest);
      if (invitationId === null) {
        return failure({ code: AcceptMemberAccessInvitationErrorCodes.InvitationNotFound });
      }
      const invitation = await scope.invitations.findById(invitationId);
      if (invitation === null) {
        return failure({ code: AcceptMemberAccessInvitationErrorCodes.InvitationNotFound });
      }

      const lifecycle = invitation.accept(now);
      if (!lifecycle.success) {
        return failure({ code: lifecycle.error.code });
      }

      await scope.acceptanceLock.acquireUser(userId.value);
      await scope.acceptanceLock.acquireMember(invitation.organizationId, invitation.memberId);

      const facts = await scope.linkingFacts.find({
        memberId: invitation.memberId,
        organizationId: invitation.organizationId,
        userId: userId.value,
      });
      if (facts.memberStatus !== 'active') {
        return failure({ code: AcceptMemberAccessInvitationErrorCodes.MemberUnavailable });
      }

      const activeAccesses = facts.accesses.filter(
        (fact) => fact.status === OrganizationAccessStatuses.Active,
      );
      const userAccess = activeAccesses.find((fact) => fact.userId.equals(userId.value));
      const memberAccess = activeAccesses.find((fact) =>
        fact.memberId?.equals(invitation.memberId),
      );
      if (
        memberAccess !== undefined &&
        (userAccess === undefined || !memberAccess.accessId.equals(userAccess.accessId))
      ) {
        return failure({ code: AcceptMemberAccessInvitationErrorCodes.MemberAlreadyLinked });
      }

      let access =
        userAccess === undefined
          ? null
          : await scope.organizationAccesses.findById(
              invitation.organizationId,
              userAccess.accessId,
            );
      if (userAccess !== undefined && access === null) {
        return failure({ code: AcceptMemberAccessInvitationErrorCodes.AccessInactive });
      }
      if (access === null) {
        access = OrganizationAccess.grantOwner({
          id: this.dependencies.organizationAccessIdGenerator.generate(),
          organizationId: invitation.organizationId,
          userId: userId.value,
        });
        const linked = access.linkMember({
          memberId: invitation.memberId,
          organizationId: invitation.organizationId,
        });
        if (!linked.success) return failure(linked.error);

        await scope.organizationAccesses.add(access);
      } else {
        const linked = access.linkMember({
          memberId: invitation.memberId,
          organizationId: invitation.organizationId,
        });
        if (!linked.success) return failure(linked.error);
        await scope.organizationAccesses.save(access);
      }

      await scope.invitations.save(invitation);
      return success(
        Object.freeze({
          accessId: access.id,
          memberId: invitation.memberId,
          organizationId: invitation.organizationId,
        }),
      );
    });
  }
}
