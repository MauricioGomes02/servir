import { MemberId, type MemberIdError } from '@/modules/membership/domain';
import { OrganizationId, type OrganizationIdError } from '@/modules/organizations/domain';
import type { Clock } from '@/shared/application/clock';
import type { ExecutionContext } from '@/shared/application/context';
import type { IdGenerator } from '@/shared/application/id-generator';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { combineValidationResults, type ValidationErrors } from '@/shared/application/validation';
import { failure, success, type Result } from '@/shared/core/result';
import { Instant } from '@/shared/domain/instant';

import {
  MemberAccessInvitation,
  MemberAccessInvitationErrorCodes,
  OrganizationAccessStatuses,
  type MemberAccessInvitationCreationError,
  type MemberAccessInvitationId,
  UserId,
} from '../domain';
import type { MemberAccessInvitationWriteScope } from './member-access-invitation-write-scope';
import type {
  MemberAccessInvitationTokenDigester,
  MemberAccessInvitationTokenGenerator,
} from './member-access-invitation-token';

export const MEMBER_ACCESS_INVITATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

export const InviteMemberToAccessErrorCodes = {
  AuthenticatedActorRequired: 'identity.member_access_invitation.authenticated_actor_required',
  Forbidden: 'identity.member_access_invitation.forbidden',
  MemberAlreadyLinked: 'identity.member_access_invitation.member_already_linked',
  MemberUnavailable: 'identity.member_access_invitation.member_unavailable',
} as const;

export type InviteMemberToAccessError =
  | OrganizationIdError
  | MemberIdError
  | MemberAccessInvitationCreationError
  | ValidationErrors
  | Readonly<{
      code: (typeof InviteMemberToAccessErrorCodes)[keyof typeof InviteMemberToAccessErrorCodes];
    }>;

export interface InviteMemberToAccessCommand {
  readonly memberId: unknown;
  readonly organizationId: unknown;
}

export interface InviteMemberToAccessOutput {
  readonly expiresAt: Instant;
  readonly invitationId: MemberAccessInvitationId;
  readonly rawToken: string;
}

export interface InviteMemberToAccessDependencies {
  readonly clock: Clock;
  readonly invitationIdGenerator: IdGenerator<MemberAccessInvitationId>;
  readonly tokenDigester: MemberAccessInvitationTokenDigester;
  readonly tokenGenerator: MemberAccessInvitationTokenGenerator;
  readonly unitOfWork: UnitOfWork<MemberAccessInvitationWriteScope>;
}

function expirationFrom(now: Instant): Result<Instant, MemberAccessInvitationCreationError> {
  const date = new Date(now.toEpochMilliseconds() + MEMBER_ACCESS_INVITATION_LIFETIME_MS);
  if (Number.isNaN(date.getTime())) {
    return failure({
      code: MemberAccessInvitationErrorCodes.ExpirationInvalid,
      field: 'expiresAt',
    });
  }
  const expiresAt = Instant.create(date.toISOString());
  return expiresAt.success
    ? success(expiresAt.value)
    : failure({
        code: MemberAccessInvitationErrorCodes.ExpirationInvalid,
        field: 'expiresAt',
      });
}

export class InviteMemberToAccessHandler {
  constructor(private readonly dependencies: InviteMemberToAccessDependencies) {}

  async handle(
    command: InviteMemberToAccessCommand,
    context: ExecutionContext,
  ): Promise<Result<InviteMemberToAccessOutput, InviteMemberToAccessError>> {
    const userId = UserId.create(context.actor?.userId);
    if (!userId.success) {
      return failure({ code: InviteMemberToAccessErrorCodes.AuthenticatedActorRequired });
    }

    const validated = combineValidationResults(
      OrganizationId.create(command.organizationId),
      MemberId.create(command.memberId),
    );
    if (!validated.success) return validated;
    const [organizationId, memberId] = validated.value;

    const now = this.dependencies.clock.now();
    const expiresAt = expirationFrom(now);
    if (!expiresAt.success) return expiresAt;
    const rawToken = this.dependencies.tokenGenerator.generate();
    const invitation = MemberAccessInvitation.invite({
      expiresAt: expiresAt.value,
      id: this.dependencies.invitationIdGenerator.generate(),
      memberId,
      now,
      organizationId,
      tokenDigest: this.dependencies.tokenDigester.digest(rawToken),
    });
    if (!invitation.success) return invitation;

    const persisted = await this.dependencies.unitOfWork.execute(async (scope) => {
      const facts = await scope.linkingFacts.find({
        memberId,
        organizationId,
        userId: userId.value,
      });
      if (facts.memberStatus !== 'active') {
        return failure({ code: InviteMemberToAccessErrorCodes.MemberUnavailable } as const);
      }
      const activeAccesses = facts.accesses.filter(
        (fact) => fact.status === OrganizationAccessStatuses.Active,
      );
      if (!activeAccesses.some((fact) => fact.userId.equals(userId.value))) {
        return failure({ code: InviteMemberToAccessErrorCodes.Forbidden } as const);
      }
      if (activeAccesses.some((fact) => fact.memberId?.equals(memberId))) {
        return failure({ code: InviteMemberToAccessErrorCodes.MemberAlreadyLinked } as const);
      }
      await scope.invitations.add(invitation.value);
      return success(undefined);
    });
    if (!persisted.success) return persisted;

    return success(
      Object.freeze({
        expiresAt: invitation.value.expiresAt,
        invitationId: invitation.value.id,
        rawToken,
      }),
    );
  }
}
