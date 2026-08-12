import type { TestContext } from 'node:test';
import { Pool } from 'pg';

export function requireTestDatabaseUrl(): string {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (databaseUrl === undefined || databaseUrl.trim() === '') {
    throw new Error('TEST_DATABASE_URL is required for PostgreSQL integration tests');
  }
  return databaseUrl;
}

export function createPostgresIntegrationPool(testContext: TestContext): Pool {
  const pool = new Pool({ connectionString: requireTestDatabaseUrl() });
  testContext.after(() => pool.end());
  return pool;
}

export async function cleanupOrganizations(
  pool: Pool,
  organizationIds: readonly string[],
): Promise<void> {
  const parameters = [[...organizationIds]];
  const tenantTables = [
    'availability_requests',
    'activity_occurrences',
    'activity_ministries',
    'activities',
    'team_leaderships',
    'team_memberships',
    'ministry_role_qualifications',
    'ministry_memberships',
    'ministry_teams',
    'ministry_roles',
    'ministries',
    'members',
  ] as const;
  await pool.query(
    `DELETE FROM outbox_messages
     WHERE partition_key = ANY($1::text[])
        OR payload->>'organizationId' = ANY($1::text[])`,
    parameters,
  );
  for (const table of tenantTables)
    await pool.query(`DELETE FROM ${table} WHERE organization_id = ANY($1::uuid[])`, parameters);
  await pool.query('DELETE FROM organizations WHERE id = ANY($1::uuid[])', parameters);
}
