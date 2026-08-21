import { MemberId, type MemberStatus } from '@/modules/membership/domain';
import type { MemberAccessLinkingFactsReader } from '../application';
import {
  OrganizationAccessId,
  OrganizationAccessStatuses,
  UserId,
  type OrganizationAccessStatus,
} from '../domain';
import type { PoolClient, QueryResultRow } from 'pg';

export const PostgresMemberAccessLinkingFactsReaderErrorCode =
  'identity.member_access_linking_facts_reader.read_failed' as const;

export class PostgresMemberAccessLinkingFactsReaderError extends Error {
  readonly code = PostgresMemberAccessLinkingFactsReaderErrorCode;

  constructor(override readonly cause: unknown) {
    super(PostgresMemberAccessLinkingFactsReaderErrorCode, { cause });
    this.name = 'PostgresMemberAccessLinkingFactsReaderError';
  }
}

interface AccessRow extends QueryResultRow {
  readonly id: string;
  readonly member_id: string | null;
  readonly status: string;
  readonly user_id: string;
}

function value<T>(result: { success: true; value: T } | { success: false }): T {
  if (!result.success) throw new PostgresMemberAccessLinkingFactsReaderError(result);
  return result.value;
}

function accessStatus(input: string): OrganizationAccessStatus {
  if (input === OrganizationAccessStatuses.Active || input === OrganizationAccessStatuses.Revoked) {
    return input;
  }
  throw new PostgresMemberAccessLinkingFactsReaderError(input);
}

function memberStatus(input: unknown): MemberStatus {
  if (input === 1) return 'active';
  if (input === 0) return 'inactive';
  throw new PostgresMemberAccessLinkingFactsReaderError(input);
}

export class PostgresMemberAccessLinkingFactsReader implements MemberAccessLinkingFactsReader {
  constructor(private readonly client: PoolClient) {}

  async find(input: Parameters<MemberAccessLinkingFactsReader['find']>[0]) {
    try {
      const member = await this.client.query<{ status: unknown }>(
        'SELECT status FROM members WHERE organization_id = $1 AND id = $2',
        [input.organizationId.toString(), input.memberId.toString()],
      );
      const accesses = await this.client.query<AccessRow>(
        `SELECT id, user_id, member_id, status
           FROM organization_accesses
          WHERE organization_id = $1 AND (user_id = $2 OR member_id = $3)`,
        [input.organizationId.toString(), input.userId.toString(), input.memberId.toString()],
      );
      return Object.freeze({
        accesses: Object.freeze(
          accesses.rows.map((row) =>
            Object.freeze({
              accessId: value(OrganizationAccessId.create(row.id)),
              ...(row.member_id === null
                ? {}
                : { memberId: value(MemberId.create(row.member_id)) }),
              status: accessStatus(row.status),
              userId: value(UserId.create(row.user_id)),
            }),
          ),
        ),
        memberStatus: member.rows[0] === undefined ? null : memberStatus(member.rows[0].status),
      });
    } catch (cause) {
      if (cause instanceof PostgresMemberAccessLinkingFactsReaderError) throw cause;
      throw new PostgresMemberAccessLinkingFactsReaderError(cause);
    }
  }
}
