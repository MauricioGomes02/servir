import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Pool } from 'pg';
import { requireTestDatabaseUrl } from '@/test-support/postgres-integration';

const databaseUrl = requireTestDatabaseUrl();
const ids = {
  firstOrganization: '0198f334-6dc5-7c20-9af1-91d7e599fa01',
  secondOrganization: '0198f334-6dc5-7c20-9af1-91d7e599fa02',
  firstMinistry: '0198f334-6dc5-7c20-9af1-91d7e599fa03',
  secondMinistry: '0198f334-6dc5-7c20-9af1-91d7e599fa04',
  firstMember: '0198f334-6dc5-7c20-9af1-91d7e599fa05',
  secondMember: '0198f334-6dc5-7c20-9af1-91d7e599fa06',
  firstRole: '0198f334-6dc5-7c20-9af1-91d7e599fa07',
  membership: '0198f334-6dc5-7c20-9af1-91d7e599fa08',
  secondRole: '0198f334-6dc5-7c20-9af1-91d7e599fa09',
  qualification: '0198f334-6dc5-7c20-9af1-91d7e599fa10',
} as const;

describe('PostgreSQL organization tenant boundaries', () => {
  it('rejects relationships that cross organization boundaries', async (testContext) => {
    const pool = new Pool({ connectionString: databaseUrl });
    async function cleanup() {
      await pool.query(
        'DELETE FROM ministry_role_qualifications WHERE organization_id = ANY($1::uuid[])',
        [[ids.firstOrganization, ids.secondOrganization]],
      );
      await pool.query('DELETE FROM ministry_memberships WHERE organization_id = ANY($1::uuid[])', [
        [ids.firstOrganization, ids.secondOrganization],
      ]);
      await pool.query('DELETE FROM ministry_roles WHERE organization_id = ANY($1::uuid[])', [
        [ids.firstOrganization, ids.secondOrganization],
      ]);
      await pool.query('DELETE FROM ministries WHERE organization_id = ANY($1::uuid[])', [
        [ids.firstOrganization, ids.secondOrganization],
      ]);
      await pool.query('DELETE FROM members WHERE organization_id = ANY($1::uuid[])', [
        [ids.firstOrganization, ids.secondOrganization],
      ]);
      await pool.query('DELETE FROM organizations WHERE id = ANY($1::uuid[])', [
        [ids.firstOrganization, ids.secondOrganization],
      ]);
    }
    await cleanup();
    testContext.after(async () => {
      await cleanup();
      await pool.end();
    });
    await pool.query('INSERT INTO organizations (id, name) VALUES ($1, $2), ($3, $4)', [
      ids.firstOrganization,
      'First tenant',
      ids.secondOrganization,
      'Second tenant',
    ]);
    await pool.query(
      'INSERT INTO ministries (id, organization_id, name, status) VALUES ($1, $2, $3, 1), ($4, $5, $6, 1)',
      [
        ids.firstMinistry,
        ids.firstOrganization,
        'First ministry',
        ids.secondMinistry,
        ids.secondOrganization,
        'Second ministry',
      ],
    );
    await pool.query(
      'INSERT INTO members (id, organization_id, name, status, registered_at) VALUES ($1, $2, $3, 1, now()), ($4, $5, $6, 1, now())',
      [
        ids.firstMember,
        ids.firstOrganization,
        'First member',
        ids.secondMember,
        ids.secondOrganization,
        'Second member',
      ],
    );
    await pool.query(
      'INSERT INTO ministry_roles (id, organization_id, ministry_id, name, status) VALUES ($1, $2, $3, $4, 1), ($5, $6, $7, $8, 1)',
      [
        ids.firstRole,
        ids.firstOrganization,
        ids.firstMinistry,
        'Singer',
        ids.secondRole,
        ids.secondOrganization,
        ids.secondMinistry,
        'Speaker',
      ],
    );

    await assert.rejects(
      pool.query(
        'INSERT INTO ministry_memberships (id, organization_id, ministry_id, member_id, status, requested_at) VALUES ($1, $2, $3, $4, 1, now())',
        [ids.membership, ids.firstOrganization, ids.firstMinistry, ids.secondMember],
      ),
    );
    await assert.rejects(
      pool.query(
        'INSERT INTO ministry_roles (id, organization_id, ministry_id, name, status) VALUES ($1, $2, $3, $4, 1)',
        [
          '0198f334-6dc5-7c20-9af1-91d7e599fa11',
          ids.secondOrganization,
          ids.firstMinistry,
          'Cross-tenant role',
        ],
      ),
    );
    await pool.query(
      'INSERT INTO ministry_memberships (id, organization_id, ministry_id, member_id, status, requested_at) VALUES ($1, $2, $3, $4, 2, now())',
      [ids.membership, ids.firstOrganization, ids.firstMinistry, ids.firstMember],
    );
    await assert.rejects(
      pool.query(
        'INSERT INTO ministry_role_qualifications (id, organization_id, ministry_id, ministry_membership_id, ministry_role_id, status, qualified_at) VALUES ($1, $2, $3, $4, $5, 1, now())',
        [
          ids.qualification,
          ids.firstOrganization,
          ids.firstMinistry,
          ids.membership,
          ids.secondRole,
        ],
      ),
    );
  });
});
