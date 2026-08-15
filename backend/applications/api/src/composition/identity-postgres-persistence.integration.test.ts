import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createAuthenticatedActor,
  parseIdentityIssuer,
  parseIdentitySubject,
} from '@/shared/application/authentication';
import { ExternalIdentity, User, UserId } from '@/modules/identity/domain';
import { requireTestDatabaseUrl } from '@/test-support/postgres-integration';
import { Pool } from 'pg';

import { createPostgresPersistence } from './create-postgres-persistence';
import { userProvisioner } from './modules/identity-persistence-module';

const FIRST_USER_ID = '0198f334-6dc5-7c20-9af1-91d7e599e101';
const SECOND_USER_ID = '0198f334-6dc5-7c20-9af1-91d7e599e102';

function value<T>(result: { success: true; value: T } | { success: false }): T {
  if (!result.success) throw new Error('Invalid deterministic integration fixture');
  return result.value;
}

describe('PostgreSQL user provisioning', () => {
  it('returns one global user for concurrent attempts with the same external identity', async (testContext) => {
    const databaseUrl = requireTestDatabaseUrl();
    const pool = new Pool({ connectionString: databaseUrl });
    const persistence = createPostgresPersistence(databaseUrl);
    const identity = createAuthenticatedActor({
      issuer: value(parseIdentityIssuer('https://identity.integration.example.com')),
      subject: value(parseIdentitySubject('concurrent-user')),
    });
    const externalIdentity = value(ExternalIdentity.create(identity));
    const candidates = [
      User.provision(value(UserId.create(FIRST_USER_ID)), externalIdentity),
      User.provision(value(UserId.create(SECOND_USER_ID)), externalIdentity),
    ];

    async function cleanup(): Promise<void> {
      await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [
        [FIRST_USER_ID, SECOND_USER_ID],
      ]);
    }

    await cleanup();
    testContext.after(async () => {
      await cleanup();
      await persistence.close();
      await pool.end();
    });

    const provisioner = persistence.services.get(userProvisioner);
    const results = await Promise.all(
      candidates.map((candidate) => provisioner.provision(candidate)),
    );

    assert.equal(results.filter((result) => result.created).length, 1);
    assert.equal(results.filter((result) => !result.created).length, 1);
    assert.equal(results[0]?.user.id.equals(results[1]?.user.id), true);

    const storedUsers = await pool.query(
      `SELECT u.id
         FROM users u
         JOIN user_external_identities i ON i.user_id = u.id
        WHERE i.issuer = $1 AND i.subject = $2`,
      [identity.issuer, identity.subject],
    );
    assert.equal(storedUsers.rowCount, 1);

    const orphan = await pool.query(
      `SELECT id FROM users
        WHERE id = ANY($1::uuid[])
          AND NOT EXISTS (
            SELECT 1 FROM user_external_identities i WHERE i.user_id = users.id
          )`,
      [[FIRST_USER_ID, SECOND_USER_ID]],
    );
    assert.equal(orphan.rowCount, 0);
  });
});
