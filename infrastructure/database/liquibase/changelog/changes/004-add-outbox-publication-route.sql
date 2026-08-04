--liquibase formatted sql

--changeset servir:004-add-outbox-publication-route
ALTER TABLE outbox_messages
    ADD COLUMN publication_channel text,
    ADD COLUMN event_source text,
    ADD COLUMN event_type text;

UPDATE outbox_messages
SET publication_channel = CASE event_name
        WHEN 'organization.created' THEN 'servir.organizations.events'
        WHEN 'member.registered' THEN 'servir.membership.events'
    END,
    event_source = CASE event_name
        WHEN 'organization.created' THEN 'urn:servir:organizations'
        WHEN 'member.registered' THEN 'urn:servir:membership'
    END,
    event_type = CASE event_name
        WHEN 'organization.created' THEN 'servir.organizations.organization.created.v1'
        WHEN 'member.registered' THEN 'servir.membership.member.registered.v1'
    END;

ALTER TABLE outbox_messages
    ALTER COLUMN publication_channel SET NOT NULL,
    ALTER COLUMN event_source SET NOT NULL,
    ALTER COLUMN event_type SET NOT NULL,
    ADD CONSTRAINT outbox_messages_publication_channel_not_blank
        CHECK (length(btrim(publication_channel)) > 0),
    ADD CONSTRAINT outbox_messages_event_source_not_blank
        CHECK (length(btrim(event_source)) > 0),
    ADD CONSTRAINT outbox_messages_event_type_not_blank
        CHECK (length(btrim(event_type)) > 0);

--rollback ALTER TABLE outbox_messages DROP CONSTRAINT outbox_messages_event_type_not_blank, DROP CONSTRAINT outbox_messages_event_source_not_blank, DROP CONSTRAINT outbox_messages_publication_channel_not_blank, DROP COLUMN event_type, DROP COLUMN event_source, DROP COLUMN publication_channel;
