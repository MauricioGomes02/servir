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
