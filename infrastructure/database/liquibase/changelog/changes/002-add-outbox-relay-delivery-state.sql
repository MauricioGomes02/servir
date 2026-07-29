--liquibase formatted sql

--changeset servir:003-add-outbox-relay-delivery-state
ALTER TABLE outbox_messages
    ADD COLUMN event_version integer NOT NULL DEFAULT 1,
    ADD COLUMN aggregate_id uuid,
    ADD COLUMN partition_key text,
    ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN persisted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN available_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN attempt_count integer NOT NULL DEFAULT 0,
    ADD COLUMN lease_id uuid,
    ADD COLUMN lease_expires_at timestamptz,
    ADD COLUMN published_at timestamptz,
    ADD COLUMN failed_at timestamptz,
    ADD COLUMN last_error_code text,
    ADD CONSTRAINT outbox_messages_event_version_positive CHECK (event_version > 0),
    ADD CONSTRAINT outbox_messages_partition_key_not_blank CHECK (
        partition_key IS NULL OR length(btrim(partition_key)) > 0
    ),
    ADD CONSTRAINT outbox_messages_metadata_is_object CHECK (
        jsonb_typeof(metadata) = 'object'
    ),
    ADD CONSTRAINT outbox_messages_attempt_count_not_negative CHECK (attempt_count >= 0),
    ADD CONSTRAINT outbox_messages_lease_complete CHECK (
        (lease_id IS NULL) = (lease_expires_at IS NULL)
    ),
    ADD CONSTRAINT outbox_messages_terminal_state_exclusive CHECK (
        published_at IS NULL OR failed_at IS NULL
    ),
    ADD CONSTRAINT outbox_messages_last_error_code_not_blank CHECK (
        last_error_code IS NULL OR length(btrim(last_error_code)) > 0
    );

CREATE INDEX outbox_messages_available_for_delivery_idx
    ON outbox_messages (available_at, sequence_number)
    WHERE published_at IS NULL AND failed_at IS NULL;

--rollback DROP INDEX outbox_messages_available_for_delivery_idx;
--rollback ALTER TABLE outbox_messages DROP CONSTRAINT outbox_messages_last_error_code_not_blank, DROP CONSTRAINT outbox_messages_terminal_state_exclusive, DROP CONSTRAINT outbox_messages_lease_complete, DROP CONSTRAINT outbox_messages_attempt_count_not_negative, DROP CONSTRAINT outbox_messages_metadata_is_object, DROP CONSTRAINT outbox_messages_partition_key_not_blank, DROP CONSTRAINT outbox_messages_event_version_positive, DROP COLUMN last_error_code, DROP COLUMN failed_at, DROP COLUMN published_at, DROP COLUMN lease_expires_at, DROP COLUMN lease_id, DROP COLUMN attempt_count, DROP COLUMN available_at, DROP COLUMN persisted_at, DROP COLUMN metadata, DROP COLUMN partition_key, DROP COLUMN aggregate_id, DROP COLUMN event_version;
