import { MemberId } from '@/modules/membership/domain';
import { OrganizationId } from '@/modules/organizations/domain';
import { Instant } from '@/shared/domain/instant';
import type { MinistryMembershipRepository } from '../../application';
import {
  MinistryId,
  MinistryMembership,
  MinistryMembershipId,
  MinistryRoleId,
  MinistryRoleQualification,
  MinistryRoleQualificationId,
  type MinistryMembershipStatus,
  type MinistryRoleQualificationStatus,
} from '../../domain';
import type { PoolClient, QueryResult, QueryResultRow } from 'pg';
import {
  fromMinistryMembershipStatusCode,
  toMinistryMembershipStatusCode,
} from './ministry-membership-status-code';
import {
  PostgresMinistryMembershipRepositoryError,
  PostgresMinistryMembershipRepositoryErrorCodes,
  type PostgresMinistryMembershipRepositoryErrorCode,
} from './postgres-ministry-membership-repository-error';

interface MinistryMembershipRow extends QueryResultRow {
  readonly approved_at: unknown;
  readonly id: unknown;
  readonly member_id: unknown;
  readonly ministry_id: unknown;
  readonly organization_id: unknown;
  readonly requested_at: unknown;
  readonly status: unknown;
}

interface QualificationRow extends QueryResultRow {
  readonly id: unknown;
  readonly ministry_role_id: unknown;
  readonly qualified_at: unknown;
  readonly status: unknown;
}

interface QualificationSnapshot {
  readonly status: MinistryRoleQualificationStatus;
}

interface MinistryMembershipSnapshot {
  readonly approvedAt: string | null;
  readonly qualifications: Readonly<Record<string, QualificationSnapshot>>;
  readonly status: MinistryMembershipStatus;
}

function value<T>(result: { success: true; value: T } | { success: false }): T {
  if (!result.success) {
    throw new PostgresMinistryMembershipRepositoryError(
      PostgresMinistryMembershipRepositoryErrorCodes.InvalidPersistedValue,
      result,
    );
  }
  return result.value;
}

function persistedInstant(input: unknown): Instant {
  return value(Instant.create(input instanceof Date ? input.toISOString() : input));
}

function qualificationStatus(input: unknown): MinistryRoleQualificationStatus {
  if (input === 1) return 'active';
  if (input === 2) return 'revoked';
  throw new PostgresMinistryMembershipRepositoryError(
    PostgresMinistryMembershipRepositoryErrorCodes.InvalidPersistedValue,
    input,
  );
}

function qualificationStatusCode(status: MinistryRoleQualificationStatus): number {
  return status === 'active' ? 1 : 2;
}

function membershipStatus(input: unknown): MinistryMembershipStatus {
  try {
    return fromMinistryMembershipStatusCode(input);
  } catch (cause) {
    throw new PostgresMinistryMembershipRepositoryError(
      PostgresMinistryMembershipRepositoryErrorCodes.InvalidPersistedValue,
      cause,
    );
  }
}

function snapshot(membership: MinistryMembership): MinistryMembershipSnapshot {
  return Object.freeze({
    approvedAt: membership.approvedAt?.toISOString() ?? null,
    qualifications: Object.freeze(
      Object.fromEntries(
        membership.roleQualifications.map((qualification) => [
          qualification.id.toString(),
          Object.freeze({ status: qualification.status }),
        ]),
      ),
    ),
    status: membership.status,
  });
}

export class PostgresMinistryMembershipRepository implements MinistryMembershipRepository {
  private readonly snapshots = new WeakMap<MinistryMembership, MinistryMembershipSnapshot>();

  constructor(private readonly client: PoolClient) {}

  private async query<TRow extends QueryResultRow = QueryResultRow>(
    errorCode: PostgresMinistryMembershipRepositoryErrorCode,
    text: string,
    values: readonly unknown[],
  ): Promise<QueryResult<TRow>> {
    try {
      return await this.client.query<TRow>(text, [...values]);
    } catch (cause) {
      if (cause instanceof PostgresMinistryMembershipRepositoryError) throw cause;
      throw new PostgresMinistryMembershipRepositoryError(errorCode, cause);
    }
  }

  async add(membership: MinistryMembership): Promise<void> {
    await this.query(
      PostgresMinistryMembershipRepositoryErrorCodes.AddFailed,
      `INSERT INTO ministry_memberships (
         id, organization_id, ministry_id, member_id, status, requested_at, approved_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        membership.id.toString(),
        membership.organizationId.toString(),
        membership.ministryId.toString(),
        membership.memberId.toString(),
        toMinistryMembershipStatusCode(membership.status),
        membership.requestedAt.toISOString(),
        membership.approvedAt?.toISOString() ?? null,
      ],
    );
    for (const qualification of membership.roleQualifications) {
      await this.insertQualification(
        membership,
        qualification,
        PostgresMinistryMembershipRepositoryErrorCodes.AddFailed,
      );
    }
    this.snapshots.set(membership, snapshot(membership));
  }

  async findById(
    organizationId: OrganizationId,
    ministryId: MinistryId,
    membershipId: MinistryMembershipId,
  ): Promise<MinistryMembership | undefined> {
    const result = await this.query<MinistryMembershipRow>(
      PostgresMinistryMembershipRepositoryErrorCodes.ReadFailed,
      `SELECT id, organization_id, ministry_id, member_id, status, requested_at, approved_at
         FROM ministry_memberships
        WHERE id = $1 AND organization_id = $2 AND ministry_id = $3`,
      [membershipId.toString(), organizationId.toString(), ministryId.toString()],
    );
    const row = result.rows[0];
    if (row === undefined) return undefined;
    const qualificationsResult = await this.query<QualificationRow>(
      PostgresMinistryMembershipRepositoryErrorCodes.ReadFailed,
      `SELECT id, ministry_role_id, status, qualified_at
         FROM ministry_role_qualifications
        WHERE organization_id = $1 AND ministry_id = $2 AND ministry_membership_id = $3`,
      [organizationId.toString(), ministryId.toString(), membershipId.toString()],
    );
    const approvedAt = row.approved_at === null ? undefined : persistedInstant(row.approved_at);
    const membership = MinistryMembership.reconstitute({
      id: value(MinistryMembershipId.create(row.id)),
      organizationId: value(OrganizationId.create(row.organization_id)),
      ministryId: value(MinistryId.create(row.ministry_id)),
      memberId: value(MemberId.create(row.member_id)),
      status: membershipStatus(row.status),
      requestedAt: persistedInstant(row.requested_at),
      ...(approvedAt === undefined ? {} : { approvedAt }),
      roleQualifications: qualificationsResult.rows.map((qualification) =>
        MinistryRoleQualification.reconstitute(
          value(MinistryRoleQualificationId.create(qualification.id)),
          value(MinistryRoleId.create(qualification.ministry_role_id)),
          qualificationStatus(qualification.status),
          persistedInstant(qualification.qualified_at),
        ),
      ),
    });
    this.snapshots.set(membership, snapshot(membership));
    return membership;
  }

  async save(membership: MinistryMembership): Promise<void> {
    const previous = this.snapshots.get(membership);
    if (previous === undefined) {
      throw new PostgresMinistryMembershipRepositoryError(
        PostgresMinistryMembershipRepositoryErrorCodes.UntrackedOnSave,
        membership.id,
      );
    }
    const current = snapshot(membership);
    const membershipChanges: Array<Readonly<{ column: string; value: unknown }>> = [];
    if (previous.status !== current.status) {
      membershipChanges.push({
        column: 'status',
        value: toMinistryMembershipStatusCode(current.status),
      });
    }
    if (previous.approvedAt !== current.approvedAt) {
      membershipChanges.push({ column: 'approved_at', value: current.approvedAt });
    }
    if (membershipChanges.length > 0) {
      const values = membershipChanges.map((change) => change.value);
      values.push(
        membership.id.toString(),
        membership.ministryId.toString(),
        membership.organizationId.toString(),
      );
      const updated = await this.query(
        PostgresMinistryMembershipRepositoryErrorCodes.SaveFailed,
        `UPDATE ministry_memberships
            SET ${membershipChanges.map((change, index) => `${change.column} = $${index + 1}`).join(', ')}
          WHERE id = $${membershipChanges.length + 1}
            AND ministry_id = $${membershipChanges.length + 2}
            AND organization_id = $${membershipChanges.length + 3}`,
        values,
      );
      this.requireUpdated(updated, membership.id);
    }

    for (const qualification of membership.roleQualifications) {
      const priorQualification = previous.qualifications[qualification.id.toString()];
      if (priorQualification === undefined) {
        await this.insertQualification(
          membership,
          qualification,
          PostgresMinistryMembershipRepositoryErrorCodes.SaveFailed,
        );
        continue;
      }
      if (priorQualification.status === qualification.status) continue;
      const updated = await this.query(
        PostgresMinistryMembershipRepositoryErrorCodes.SaveFailed,
        `UPDATE ministry_role_qualifications
            SET status = $1
          WHERE id = $2 AND ministry_membership_id = $3
            AND ministry_id = $4 AND organization_id = $5`,
        [
          qualificationStatusCode(qualification.status),
          qualification.id.toString(),
          membership.id.toString(),
          membership.ministryId.toString(),
          membership.organizationId.toString(),
        ],
      );
      this.requireUpdated(updated, qualification.id);
    }
    this.snapshots.set(membership, current);
  }

  private async insertQualification(
    membership: MinistryMembership,
    qualification: MinistryRoleQualification,
    errorCode: PostgresMinistryMembershipRepositoryErrorCode,
  ): Promise<void> {
    await this.query(
      errorCode,
      `INSERT INTO ministry_role_qualifications (
         id, organization_id, ministry_id, ministry_membership_id,
         ministry_role_id, status, qualified_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        qualification.id.toString(),
        membership.organizationId.toString(),
        membership.ministryId.toString(),
        membership.id.toString(),
        qualification.ministryRoleId.toString(),
        qualificationStatusCode(qualification.status),
        qualification.qualifiedAt.toISOString(),
      ],
    );
  }

  private requireUpdated(result: QueryResult, identity: unknown): void {
    if (result.rowCount === 1) return;
    throw new PostgresMinistryMembershipRepositoryError(
      PostgresMinistryMembershipRepositoryErrorCodes.MissingOnSave,
      identity,
    );
  }
}
