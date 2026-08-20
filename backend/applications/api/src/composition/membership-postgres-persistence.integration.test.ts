import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createMemberDetails, RegisterMemberHandler } from '@/modules/membership/application';
import { MemberId, MemberRegistrationPolicy } from '@/modules/membership/domain';
import { OrganizationId } from '@/modules/organizations/domain';
import { createExecutionContext, parseCorrelationId } from '@/shared/application/context';
import { parseMessageId, type MessageId } from '@/shared/application/messaging';
import { parseDomainEventId, type DomainEventId } from '@/shared/domain/domain-event';
import { Instant } from '@/shared/domain/instant';
import { FixedClock } from '@/shared/infrastructure/clock';
import { SequenceIdGenerator } from '@/shared/infrastructure/id-generator';
import { InMemoryLogger } from '@/shared/infrastructure/logging';
import { PostgresEventOutboxError } from '@/shared/infrastructure/messaging';
import { assertMemberDetailsReaderContract } from '@/modules/membership/infrastructure/persistence/member-details-reader.contract';
import { Pool } from 'pg';
import { requireTestDatabaseUrl } from '@/test-support/postgres-integration';

import { createPostgresPersistence } from './persistence/create-postgres-persistence';
import {
  memberDetailsReader,
  memberListReader,
  memberUnitOfWork,
  organizationRegistrationFacts,
} from './persistence/membership-persistence-module';

const databaseUrl = requireTestDatabaseUrl();

function requireValue<TValue>(
  result: Readonly<{ success: true; value: TValue } | { success: false }>,
): TValue {
  assert.equal(result.success, true);
  if (!result.success) throw new Error('Invalid deterministic fixture');
  return result.value;
}

describe('PostgreSQL member persistence', () => {
  it('commits member and outbox atomically and rolls both back on failure', async (testContext) => {
    const organizationIdText = '0198f334-6dc5-7c20-9af1-91d7e599a101';
    const memberIdText = '0198f334-6dc5-7c20-9af1-91d7e599a102';
    const rolledBackMemberIdText = '0198f334-6dc5-7c20-9af1-91d7e599a103';
    const inactiveMemberIdText = '0198f334-6dc5-7c20-9af1-91d7e599a109';
    const anotherOrganizationIdText = '0198f334-6dc5-7c20-9af1-91d7e599a107';
    const anotherMemberIdText = '0198f334-6dc5-7c20-9af1-91d7e599a110';
    const messageIdText = '0198f334-6dc5-7c20-9af1-91d7e599a104';
    const pool = new Pool({ connectionString: databaseUrl });
    const persistence = createPostgresPersistence(databaseUrl);

    async function cleanup(): Promise<void> {
      await pool.query('DELETE FROM outbox_messages WHERE message_id = $1', [messageIdText]);
      await pool.query('DELETE FROM members WHERE organization_id = ANY($1::uuid[])', [
        [organizationIdText, anotherOrganizationIdText],
      ]);
      await pool.query('DELETE FROM organizations WHERE id = ANY($1::uuid[])', [
        [organizationIdText, anotherOrganizationIdText],
      ]);
    }

    await cleanup();
    await pool.query('INSERT INTO organizations (id, name) VALUES ($1, $2)', [
      organizationIdText,
      'Membership integration organization',
    ]);
    await pool.query('INSERT INTO organizations (id, name) VALUES ($1, $2)', [
      anotherOrganizationIdText,
      'Another membership integration organization',
    ]);
    testContext.after(async () => {
      await cleanup();
      await persistence.close();
      await pool.end();
    });

    const organizationId = requireValue(OrganizationId.create(organizationIdText));
    const registeredAt = requireValue(Instant.create('2026-08-04T15:00:00.000Z'));
    const context = createExecutionContext({
      correlationId: requireValue(parseCorrelationId('membership-integration')),
    });

    function handler(memberId: string, eventId: string) {
      return new RegisterMemberHandler({
        clock: new FixedClock(registeredAt),
        memberIdGenerator: new SequenceIdGenerator([requireValue(MemberId.create(memberId))]),
        domainEventIdGenerator: new SequenceIdGenerator<DomainEventId>([
          requireValue(parseDomainEventId(eventId)),
        ]),
        messageIdGenerator: new SequenceIdGenerator<MessageId>([
          requireValue(parseMessageId(messageIdText)),
        ]),
        organizationRegistrationFacts: persistence.services.get(organizationRegistrationFacts),
        registrationPolicy: new MemberRegistrationPolicy(),
        unitOfWork: persistence.services.get(memberUnitOfWork),
        logger: new InMemoryLogger(),
      });
    }

    await handler(memberIdText, '0198f334-6dc5-7c20-9af1-91d7e599a105').handle(
      { organizationId: organizationId.toString(), name: 'Maria' },
      context,
    );

    const committed = await pool.query(
      `SELECT m.name, m.status, m.registered_at, o.event_name,
              o.publication_channel, o.event_source, o.event_type,
              o.event_version, o.aggregate_id, o.partition_key, o.payload
       FROM members m
       JOIN outbox_messages o ON o.aggregate_id = m.id
       WHERE m.id = $1`,
      [memberIdText],
    );

    assert.equal(committed.rowCount, 1);
    assert.equal(committed.rows[0]?.name, 'Maria');
    assert.equal(committed.rows[0]?.status, 1);
    assert.equal(committed.rows[0]?.registered_at.toISOString(), registeredAt.toISOString());
    assert.equal(committed.rows[0]?.event_name, 'member.registered');
    assert.equal(committed.rows[0]?.publication_channel, 'servir.membership.events');
    assert.equal(committed.rows[0]?.event_source, 'urn:servir:membership');
    assert.equal(committed.rows[0]?.event_type, 'servir.membership.member.registered.v1');
    assert.equal(committed.rows[0]?.event_version, 1);
    assert.equal(committed.rows[0]?.aggregate_id, memberIdText);
    assert.equal(committed.rows[0]?.partition_key, organizationIdText);
    assert.deepEqual(committed.rows[0]?.payload, {
      memberId: memberIdText,
      organizationId: organizationIdText,
      name: 'Maria',
      registeredAt: registeredAt.toISOString(),
    });

    await assertMemberDetailsReaderContract({
      reader: persistence.services.get(memberDetailsReader),
      expected: createMemberDetails({
        id: requireValue(MemberId.create(memberIdText)),
        organizationId,
        name: 'Maria',
        status: 'active',
      }),
      anotherOrganizationId: requireValue(OrganizationId.create(anotherOrganizationIdText)),
      missingMemberId: requireValue(MemberId.create('0198f334-6dc5-7c20-9af1-91d7e599a108')),
    });

    await pool.query(
      `INSERT INTO members (id, organization_id, name, status, registered_at)
         VALUES ($1, $2, 'Marina', 2, now()), ($3, $4, 'Maria from another tenant', 1, now())`,
      [inactiveMemberIdText, organizationIdText, anotherMemberIdText, anotherOrganizationIdText],
    );
    const memberPage = await persistence.services.get(memberListReader).list({
      organizationId,
      page: 1,
      pageSize: 1,
      search: 'Mar',
      status: 'active',
    });
    assert.notEqual(memberPage, undefined);
    assert.deepEqual(
      memberPage && {
        items: memberPage.items.map((item) => ({
          id: item.id.toString(),
          name: item.name,
          status: item.status,
        })),
        pagination: memberPage.pagination,
      },
      {
        items: [{ id: memberIdText, name: 'Maria', status: 'active' }],
        pagination: { page: 1, pageSize: 1, totalItems: 1, totalPages: 1 },
      },
    );

    await assert.rejects(
      handler(rolledBackMemberIdText, '0198f334-6dc5-7c20-9af1-91d7e599a106').handle(
        { organizationId: organizationId.toString(), name: 'Joana' },
        context,
      ),
      (error: unknown) => error instanceof PostgresEventOutboxError,
    );

    const rolledBack = await pool.query('SELECT 1 FROM members WHERE id = $1', [
      rolledBackMemberIdText,
    ]);
    assert.equal(rolledBack.rowCount, 0);
  });
});
