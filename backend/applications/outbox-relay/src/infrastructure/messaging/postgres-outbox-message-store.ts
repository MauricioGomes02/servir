import type {
  IntegrationEvent,
  JsonObject,
  JsonValue,
} from '@servir/integration-messaging';
import type { Pool, QueryResultRow } from 'pg';

import {
  createLeaseId,
  OutboxLeaseError,
  OutboxLeaseErrorCodes,
} from '@/application';
import type {
  ClaimedOutboxMessage,
  ClaimOutboxMessages,
  LeaseId,
  OutboxMessageStore,
} from '@/application';

import {
  PostgresOutboxMessageStoreError,
  PostgresOutboxMessageStoreErrorCodes,
  type PostgresOutboxMessageStoreErrorCode,
} from './postgres-outbox-message-store-error';

interface ClaimedOutboxRow extends QueryResultRow {
  readonly message_id: string;
  readonly event_id: string;
  readonly event_name: string;
  readonly publication_channel: string;
  readonly event_source: string;
  readonly event_type: string;
  readonly event_version: number;
  readonly occurred_at: Date;
  readonly aggregate_id: string | null;
  readonly partition_key: string | null;
  readonly correlation_id: string;
  readonly causation_id: string | null;
  readonly payload: unknown;
  readonly metadata: unknown;
  readonly attempt_count: number;
  readonly lease_id: string;
  readonly lease_expires_at: Date;
}

interface TransitionResultRow extends QueryResultRow {
  readonly updated: boolean;
  readonly current_lease_id: string | null;
  readonly current_lease_expires_at: Date | null;
}

function isJsonValue(value: unknown): value is JsonValue {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
    || (typeof value === 'number' && Number.isFinite(value))
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (typeof value !== 'object') {
    return false;
  }

  return Object.values(value).every(isJsonValue);
}

function isJsonObject(value: unknown): value is JsonObject {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return (prototype === Object.prototype || prototype === null)
    && isJsonValue(value);
}

function isOptionalString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function readPersistedMetadata(metadata: JsonObject): Readonly<{
  event: JsonObject;
  traceContext?: Readonly<{ traceparent: string; tracestate?: string }>;
}> {
  const event = metadata.event;
  const trace = metadata.trace;

  if (!isJsonObject(event) || !isJsonObject(trace)) {
    return Object.freeze({ event: metadata });
  }

  const traceparent = trace.traceparent;
  const tracestate = trace.tracestate;
  const traceContext = typeof traceparent === 'string'
    && (tracestate === undefined || typeof tracestate === 'string')
    ? Object.freeze({ traceparent, tracestate })
    : undefined;

  return Object.freeze({
    event: freezeJsonValue(event) as JsonObject,
    traceContext,
  });
}

function isValidClaimedRow(row: ClaimedOutboxRow): boolean {
  return [
    typeof row.message_id === 'string',
    typeof row.event_id === 'string',
    typeof row.event_name === 'string' && row.event_name.length > 0,
    typeof row.publication_channel === 'string'
      && row.publication_channel.length > 0,
    typeof row.event_source === 'string' && row.event_source.length > 0,
    typeof row.event_type === 'string' && row.event_type.length > 0,
    Number.isInteger(row.event_version) && row.event_version > 0,
    row.occurred_at instanceof Date
      && !Number.isNaN(row.occurred_at.getTime()),
    isOptionalString(row.aggregate_id),
    isOptionalString(row.partition_key),
    typeof row.correlation_id === 'string' && row.correlation_id.length > 0,
    isOptionalString(row.causation_id),
    isJsonObject(row.payload),
    isJsonObject(row.metadata),
    Number.isInteger(row.attempt_count) && row.attempt_count > 0,
    typeof row.lease_id === 'string',
    row.lease_expires_at instanceof Date
      && !Number.isNaN(row.lease_expires_at.getTime()),
  ].every(Boolean);
}

function freezeJsonValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return Object.freeze(value.map(freezeJsonValue));
  }

  if (value !== null && typeof value === 'object') {
    return Object.freeze(Object.fromEntries(
      Object.entries(value).map(
        ([key, item]) => [key, freezeJsonValue(item)],
      ),
    ));
  }

  return value;
}

function mapClaimedRow(row: ClaimedOutboxRow): ClaimedOutboxMessage {
  if (!isValidClaimedRow(row)) {
    throw new PostgresOutboxMessageStoreError(
      PostgresOutboxMessageStoreErrorCodes.InvalidRow,
    );
  }

  let leaseId: LeaseId;

  try {
    leaseId = createLeaseId(row.lease_id);
  } catch {
    throw new PostgresOutboxMessageStoreError(
      PostgresOutboxMessageStoreErrorCodes.InvalidRow,
    );
  }

  const persistedMetadata = readPersistedMetadata(row.metadata as JsonObject);
  const event: IntegrationEvent = Object.freeze({
    channel: row.publication_channel,
    source: row.event_source,
    type: row.event_type,
    name: row.event_name,
    version: row.event_version,
    occurredAt: row.occurred_at.toISOString(),
    aggregateId: row.aggregate_id ?? undefined,
    partitionKey: row.partition_key ?? undefined,
    payload: freezeJsonValue(row.payload as JsonObject) as JsonObject,
    metadata: persistedMetadata.event,
  });

  return Object.freeze({
    messageId: row.message_id,
    eventId: row.event_id,
    correlationId: row.correlation_id,
    causationId: row.causation_id ?? undefined,
    traceContext: persistedMetadata.traceContext,
    event,
    attemptCount: row.attempt_count,
    leaseId,
    leaseExpiresAt: row.lease_expires_at.toISOString(),
  });
}

export class PostgresOutboxMessageStore implements OutboxMessageStore {
  constructor(private readonly pool: Pool) {}

  async claim(
    input: ClaimOutboxMessages,
  ): Promise<readonly ClaimedOutboxMessage[]> {
    try {
      const result = await this.pool.query<ClaimedOutboxRow>(
        `WITH candidates AS MATERIALIZED (
           SELECT sequence_number
           FROM outbox_messages
           WHERE published_at IS NULL
             AND failed_at IS NULL
             AND available_at <= $2::timestamptz
             AND (
               lease_expires_at IS NULL
               OR lease_expires_at <= $2::timestamptz
             )
           ORDER BY available_at, sequence_number
           FOR UPDATE SKIP LOCKED
           LIMIT $4
         ), claimed AS (
           UPDATE outbox_messages AS message
           SET lease_id = $1::uuid,
               lease_expires_at = $3::timestamptz,
               attempt_count = message.attempt_count + 1
           FROM candidates
           WHERE message.sequence_number = candidates.sequence_number
           RETURNING message.*
         )
         SELECT * FROM claimed ORDER BY sequence_number`,
        [input.leaseId, input.claimedAt, input.leaseExpiresAt, input.limit],
      );

      return Object.freeze(result.rows.map(mapClaimedRow));
    } catch (cause) {
      if (cause instanceof PostgresOutboxMessageStoreError) {
        throw cause;
      }

      throw new PostgresOutboxMessageStoreError(
        PostgresOutboxMessageStoreErrorCodes.ClaimFailed,
        cause,
      );
    }
  }

  async markPublished(input: Readonly<{
    messageId: string;
    leaseId: LeaseId;
    publishedAt: string;
  }>): Promise<void> {
    await this.transition(
      `UPDATE outbox_messages
       SET published_at = $3::timestamptz,
           lease_id = NULL,
           lease_expires_at = NULL
       WHERE message_id = $1::uuid
         AND lease_id = $2::uuid
         AND lease_expires_at > $3::timestamptz
         AND published_at IS NULL
         AND failed_at IS NULL
       RETURNING message_id`,
      [input.messageId, input.leaseId, input.publishedAt],
      input,
      PostgresOutboxMessageStoreErrorCodes.MarkPublishedFailed,
    );
  }

  async reschedule(input: Readonly<{
    messageId: string;
    leaseId: LeaseId;
    failedAt: string;
    availableAt: string;
    errorCode: string;
  }>): Promise<void> {
    await this.transition(
      `UPDATE outbox_messages
       SET available_at = $4::timestamptz,
           last_error_code = $5,
           lease_id = NULL,
           lease_expires_at = NULL
       WHERE message_id = $1::uuid
         AND lease_id = $2::uuid
         AND lease_expires_at > $3::timestamptz
         AND published_at IS NULL
         AND failed_at IS NULL
       RETURNING message_id`,
      [
        input.messageId,
        input.leaseId,
        input.failedAt,
        input.availableAt,
        input.errorCode,
      ],
      {
        messageId: input.messageId,
        leaseId: input.leaseId,
        transitionAt: input.failedAt,
      },
      PostgresOutboxMessageStoreErrorCodes.RescheduleFailed,
    );
  }

  async markFailed(input: Readonly<{
    messageId: string;
    leaseId: LeaseId;
    failedAt: string;
    errorCode: string;
  }>): Promise<void> {
    await this.transition(
      `UPDATE outbox_messages
       SET failed_at = $3::timestamptz,
           last_error_code = $4,
           lease_id = NULL,
           lease_expires_at = NULL
       WHERE message_id = $1::uuid
         AND lease_id = $2::uuid
         AND lease_expires_at > $3::timestamptz
         AND published_at IS NULL
         AND failed_at IS NULL
       RETURNING message_id`,
      [input.messageId, input.leaseId, input.failedAt, input.errorCode],
      {
        messageId: input.messageId,
        leaseId: input.leaseId,
        transitionAt: input.failedAt,
      },
      PostgresOutboxMessageStoreErrorCodes.MarkFailedFailed,
    );
  }

  private async transition(
    updateSql: string,
    parameters: readonly unknown[],
    ownership: Readonly<{
      messageId: string;
      leaseId: LeaseId;
      transitionAt?: string;
      publishedAt?: string;
    }>,
    failureCode: PostgresOutboxMessageStoreErrorCode,
  ): Promise<void> {
    const transitionAt = ownership.transitionAt ?? ownership.publishedAt;

    try {
      const result = await this.pool.query<TransitionResultRow>(
        `WITH target AS MATERIALIZED (
           SELECT lease_id, lease_expires_at
           FROM outbox_messages
           WHERE message_id = $1::uuid
         ), updated AS (
           ${updateSql}
         )
         SELECT EXISTS(SELECT 1 FROM updated) AS updated,
                (SELECT lease_id FROM target) AS current_lease_id,
                (SELECT lease_expires_at FROM target) AS current_lease_expires_at`,
        [...parameters],
      );
      const state = result.rows[0];

      if (state?.updated) {
        return;
      }

      if (
        transitionAt !== undefined
        && state?.current_lease_id === ownership.leaseId
        && state.current_lease_expires_at instanceof Date
        && state.current_lease_expires_at.getTime()
          <= new Date(transitionAt).getTime()
      ) {
        throw new OutboxLeaseError(OutboxLeaseErrorCodes.Expired);
      }

      throw new OutboxLeaseError(OutboxLeaseErrorCodes.NotOwned);
    } catch (cause) {
      if (cause instanceof OutboxLeaseError) {
        throw cause;
      }

      throw new PostgresOutboxMessageStoreError(failureCode, cause);
    }
  }
}
