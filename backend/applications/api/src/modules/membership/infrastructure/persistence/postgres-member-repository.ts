import type { PoolClient } from 'pg';

import type { MemberRepository } from '../../application';
import type { Member } from '../../domain';
import { toMemberStatusCode } from './member-status-code';
import { PostgresMemberRepositoryError } from './postgres-member-repository-error';

export class PostgresMemberRepository implements MemberRepository {
  constructor(private readonly client: PoolClient) {}

  async save(member: Member): Promise<void> {
    try {
      await this.client.query(
        `INSERT INTO members (
           id, organization_id, name, status, registered_at
         ) VALUES ($1, $2, $3, $4, $5)`,
        [
          member.id.toString(),
          member.organizationId.toString(),
          member.name.toString(),
          toMemberStatusCode(member.status),
          member.registeredAt.toISOString(),
        ],
      );
    } catch (cause) {
      throw new PostgresMemberRepositoryError(cause);
    }
  }
}
