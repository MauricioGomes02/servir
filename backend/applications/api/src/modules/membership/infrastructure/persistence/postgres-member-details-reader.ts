import type { OrganizationId } from '@/modules/organizations/domain';
import {
  createMemberDetails,
  type MemberDetails,
  type MemberDetailsReader,
} from '../../application';
import type { MemberId } from '../../domain';
import type { Pool } from 'pg';

import { fromMemberStatusCode } from './member-status-code';
import { InvalidPersistedMemberDetailsError } from './invalid-persisted-member-details-error';
import { PostgresMemberDetailsReaderError } from './postgres-member-details-reader-error';

export class PostgresMemberDetailsReader implements MemberDetailsReader {
  constructor(private readonly pool: Pool) {}

  async findById(
    organizationId: OrganizationId,
    memberId: MemberId,
  ): Promise<MemberDetails | undefined> {
    try {
      const result = await this.pool.query(
        `SELECT name, status
         FROM members
         WHERE organization_id = $1 AND id = $2`,
        [organizationId.toString(), memberId.toString()],
      );
      const row = result.rows[0] as Record<string, unknown> | undefined;

      if (row === undefined) {
        return undefined;
      }

      if (typeof row.name !== 'string') {
        throw new InvalidPersistedMemberDetailsError('name');
      }

      return createMemberDetails({
        id: memberId,
        organizationId,
        name: row.name,
        status: fromMemberStatusCode(row.status),
      });
    } catch (cause) {
      throw new PostgresMemberDetailsReaderError(cause);
    }
  }
}
