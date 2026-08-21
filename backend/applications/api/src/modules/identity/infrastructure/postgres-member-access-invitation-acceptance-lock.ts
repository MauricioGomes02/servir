import type { MemberAccessInvitationAcceptanceLock } from '../application';
import type { MemberId } from '@/modules/membership/domain';
import type { OrganizationId } from '@/modules/organizations/domain';
import {
  MemberAccessInvitationId,
  type MemberAccessInvitationTokenDigest,
  type UserId,
} from '../domain';
import type { PoolClient } from 'pg';

export const PostgresMemberAccessInvitationAcceptanceLockErrorCodes = {
  InvitationLockFailed: 'identity.member_access_invitation_acceptance_lock.invitation_failed',
  InvalidPersistedInvitationId:
    'identity.member_access_invitation_acceptance_lock.invalid_persisted_invitation_id',
  MemberLockFailed: 'identity.member_access_invitation_acceptance_lock.member_failed',
  UserLockFailed: 'identity.member_access_invitation_acceptance_lock.user_failed',
} as const;

export type PostgresMemberAccessInvitationAcceptanceLockErrorCode =
  (typeof PostgresMemberAccessInvitationAcceptanceLockErrorCodes)[keyof typeof PostgresMemberAccessInvitationAcceptanceLockErrorCodes];

export class PostgresMemberAccessInvitationAcceptanceLockError extends Error {
  constructor(
    readonly code: PostgresMemberAccessInvitationAcceptanceLockErrorCode,
    override readonly cause: unknown,
  ) {
    super(code, { cause });
    this.name = 'PostgresMemberAccessInvitationAcceptanceLockError';
  }
}

export class PostgresMemberAccessInvitationAcceptanceLock implements MemberAccessInvitationAcceptanceLock {
  constructor(private readonly client: PoolClient) {}

  async acquireInvitation(
    tokenDigest: MemberAccessInvitationTokenDigest,
  ): Promise<MemberAccessInvitationId | null> {
    try {
      const result = await this.client.query<{ id: string }>(
        `SELECT id
           FROM member_access_invitations
          WHERE token_digest = $1
          FOR UPDATE`,
        [tokenDigest.toString()],
      );
      const row = result.rows[0];
      if (row === undefined) return null;
      const invitationId = MemberAccessInvitationId.create(row.id);
      if (!invitationId.success) {
        throw new PostgresMemberAccessInvitationAcceptanceLockError(
          PostgresMemberAccessInvitationAcceptanceLockErrorCodes.InvalidPersistedInvitationId,
          invitationId.error,
        );
      }
      return invitationId.value;
    } catch (cause) {
      if (cause instanceof PostgresMemberAccessInvitationAcceptanceLockError) throw cause;
      throw new PostgresMemberAccessInvitationAcceptanceLockError(
        PostgresMemberAccessInvitationAcceptanceLockErrorCodes.InvitationLockFailed,
        cause,
      );
    }
  }

  async acquireMember(organizationId: OrganizationId, memberId: MemberId): Promise<void> {
    try {
      await this.client.query(
        `SELECT id
           FROM members
          WHERE organization_id = $1 AND id = $2
          FOR UPDATE`,
        [organizationId.toString(), memberId.toString()],
      );
    } catch (cause) {
      throw new PostgresMemberAccessInvitationAcceptanceLockError(
        PostgresMemberAccessInvitationAcceptanceLockErrorCodes.MemberLockFailed,
        cause,
      );
    }
  }

  async acquireUser(userId: UserId): Promise<void> {
    try {
      await this.client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId.toString()]);
    } catch (cause) {
      throw new PostgresMemberAccessInvitationAcceptanceLockError(
        PostgresMemberAccessInvitationAcceptanceLockErrorCodes.UserLockFailed,
        cause,
      );
    }
  }
}
