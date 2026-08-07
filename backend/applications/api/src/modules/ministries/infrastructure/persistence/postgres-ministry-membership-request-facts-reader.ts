import type { MemberId } from '@/modules/membership/domain';
import type { OrganizationId } from '@/modules/organizations/domain';
import type { MinistryMembershipRequestFactsReader } from '../../application';
import type { MinistryId } from '../../domain';
import type { Pool } from 'pg';
import { PostgresMinistryMembershipRequestFactsReaderError } from './postgres-ministry-membership-request-facts-reader-error';

export class PostgresMinistryMembershipRequestFactsReader implements MinistryMembershipRequestFactsReader {
  constructor(private readonly pool: Pool) {}

  async findFor(organizationId: OrganizationId, ministryId: MinistryId, memberId: MemberId) {
    try {
      const result = await this.pool.query<{
        member_is_active: boolean;
        ministry_is_active: boolean;
        current_membership_exists: boolean;
      }>(
        `SELECT
         EXISTS (SELECT 1 FROM members WHERE id = $1 AND organization_id = $2 AND status = 1) AS member_is_active,
         EXISTS (SELECT 1 FROM ministries WHERE id = $3 AND organization_id = $2 AND status = 1) AS ministry_is_active,
         EXISTS (
           SELECT 1 FROM ministry_memberships
           WHERE organization_id = $2 AND ministry_id = $3 AND member_id = $1 AND status IN (1, 2)
         ) AS current_membership_exists`,
        [memberId.toString(), organizationId.toString(), ministryId.toString()],
      );
      const row = result.rows[0];
      return Object.freeze({
        memberIsActive: row.member_is_active,
        ministryIsActive: row.ministry_is_active,
        currentMembershipExists: row.current_membership_exists,
      });
    } catch (cause) {
      throw new PostgresMinistryMembershipRequestFactsReaderError(cause);
    }
  }
}
