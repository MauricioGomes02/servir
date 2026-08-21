import { MemberId } from '@/modules/membership/domain';
import { OrganizationId } from '@/modules/organizations/domain';
import type { MemberAccessInvitationRepository } from '../application';
import {
  MemberAccessInvitation,
  MemberAccessInvitationId,
  MemberAccessInvitationStatuses,
  MemberAccessInvitationTokenDigest,
  type MemberAccessInvitationStatus,
} from '../domain';
import { Instant } from '@/shared/domain/instant';
import type { PoolClient, QueryResult } from 'pg';

export const PostgresMemberAccessInvitationRepositoryErrorCodes = {
  AddFailed: 'identity.member_access_invitation_repository.add_failed',
  InvalidPersistedStatus: 'identity.member_access_invitation_repository.invalid_persisted_status',
  InvalidPersistedValue: 'identity.member_access_invitation_repository.invalid_persisted_value',
  MissingOnSave: 'identity.member_access_invitation_repository.missing_on_save',
  ReadFailed: 'identity.member_access_invitation_repository.read_failed',
  SaveFailed: 'identity.member_access_invitation_repository.save_failed',
  UntrackedOnSave: 'identity.member_access_invitation_repository.untracked_on_save',
} as const;

export type PostgresMemberAccessInvitationRepositoryErrorCode =
  (typeof PostgresMemberAccessInvitationRepositoryErrorCodes)[keyof typeof PostgresMemberAccessInvitationRepositoryErrorCodes];

export class PostgresMemberAccessInvitationRepositoryError extends Error {
  constructor(
    readonly code: PostgresMemberAccessInvitationRepositoryErrorCode,
    override readonly cause: unknown,
  ) {
    super(code, { cause });
    this.name = 'PostgresMemberAccessInvitationRepositoryError';
  }
}

interface InvitationRow {
  readonly expires_at: Date;
  readonly id: string;
  readonly member_id: string;
  readonly organization_id: string;
  readonly status: string;
  readonly token_digest: string;
}

function value<T>(result: { success: true; value: T } | { success: false }): T {
  if (!result.success) {
    throw new PostgresMemberAccessInvitationRepositoryError(
      PostgresMemberAccessInvitationRepositoryErrorCodes.InvalidPersistedValue,
      result,
    );
  }
  return result.value;
}

function invitationStatus(input: string): MemberAccessInvitationStatus {
  if (
    input === MemberAccessInvitationStatuses.Pending ||
    input === MemberAccessInvitationStatuses.Accepted ||
    input === MemberAccessInvitationStatuses.Revoked
  ) {
    return input;
  }
  throw new PostgresMemberAccessInvitationRepositoryError(
    PostgresMemberAccessInvitationRepositoryErrorCodes.InvalidPersistedStatus,
    input,
  );
}

function reconstitute(row: InvitationRow): MemberAccessInvitation {
  return MemberAccessInvitation.reconstitute({
    expiresAt: value(Instant.create(row.expires_at.toISOString())),
    id: value(MemberAccessInvitationId.create(row.id)),
    memberId: value(MemberId.create(row.member_id)),
    organizationId: value(OrganizationId.create(row.organization_id)),
    status: invitationStatus(row.status),
    tokenDigest: value(MemberAccessInvitationTokenDigest.create(row.token_digest)),
  });
}

export class PostgresMemberAccessInvitationRepository implements MemberAccessInvitationRepository {
  private readonly snapshots = new WeakMap<
    MemberAccessInvitation,
    Readonly<{ status: MemberAccessInvitationStatus }>
  >();

  constructor(private readonly client: PoolClient) {}

  private track(invitation: MemberAccessInvitation): void {
    this.snapshots.set(invitation, Object.freeze({ status: invitation.status }));
  }

  async add(invitation: MemberAccessInvitation): Promise<void> {
    try {
      await this.client.query(
        `INSERT INTO member_access_invitations (
           id, organization_id, member_id, token_digest, expires_at, status
         ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          invitation.id.toString(),
          invitation.organizationId.toString(),
          invitation.memberId.toString(),
          invitation.tokenDigest.toString(),
          invitation.expiresAt.toISOString(),
          invitation.status,
        ],
      );
      this.track(invitation);
    } catch (cause) {
      throw new PostgresMemberAccessInvitationRepositoryError(
        PostgresMemberAccessInvitationRepositoryErrorCodes.AddFailed,
        cause,
      );
    }
  }

  async findById(invitationId: MemberAccessInvitationId): Promise<MemberAccessInvitation | null> {
    let result: QueryResult<InvitationRow>;
    try {
      result = await this.client.query<InvitationRow>(
        `SELECT id, organization_id, member_id, token_digest, expires_at, status
           FROM member_access_invitations
          WHERE id = $1`,
        [invitationId.toString()],
      );
    } catch (cause) {
      throw new PostgresMemberAccessInvitationRepositoryError(
        PostgresMemberAccessInvitationRepositoryErrorCodes.ReadFailed,
        cause,
      );
    }
    if (result.rows[0] === undefined) return null;
    const invitation = reconstitute(result.rows[0]);
    this.track(invitation);
    return invitation;
  }

  async save(invitation: MemberAccessInvitation): Promise<void> {
    const previous = this.snapshots.get(invitation);
    if (previous === undefined) {
      throw new PostgresMemberAccessInvitationRepositoryError(
        PostgresMemberAccessInvitationRepositoryErrorCodes.UntrackedOnSave,
        invitation.id,
      );
    }
    if (previous.status === invitation.status) return;
    let result: QueryResult;
    try {
      result = await this.client.query(
        `UPDATE member_access_invitations
            SET status = $2
          WHERE id = $1`,
        [invitation.id.toString(), invitation.status],
      );
    } catch (cause) {
      throw new PostgresMemberAccessInvitationRepositoryError(
        PostgresMemberAccessInvitationRepositoryErrorCodes.SaveFailed,
        cause,
      );
    }
    if (result.rowCount !== 1) {
      throw new PostgresMemberAccessInvitationRepositoryError(
        PostgresMemberAccessInvitationRepositoryErrorCodes.MissingOnSave,
        invitation.id,
      );
    }
    this.track(invitation);
  }
}
