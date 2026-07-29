--liquibase formatted sql

--changeset servir:001-create-organizations
CREATE TABLE organizations (
    id uuid PRIMARY KEY,
    name varchar(120) NOT NULL,
    CONSTRAINT organizations_name_not_blank CHECK (length(btrim(name)) > 0)
);

--rollback DROP TABLE organizations;

--changeset servir:002-create-outbox-messages
CREATE TABLE outbox_messages (
    sequence_number bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    message_id uuid NOT NULL UNIQUE,
    event_id uuid NOT NULL UNIQUE,
    event_name text NOT NULL,
    occurred_at timestamptz NOT NULL,
    correlation_id varchar(128) NOT NULL,
    causation_id uuid,
    payload jsonb NOT NULL,
    CONSTRAINT outbox_messages_event_name_not_blank CHECK (length(btrim(event_name)) > 0),
    CONSTRAINT outbox_messages_correlation_id_not_blank CHECK (length(btrim(correlation_id)) > 0),
    CONSTRAINT outbox_messages_payload_is_object CHECK (jsonb_typeof(payload) = 'object')
);

--rollback DROP TABLE outbox_messages;
