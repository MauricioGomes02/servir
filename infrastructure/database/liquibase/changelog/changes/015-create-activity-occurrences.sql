--liquibase formatted sql

--changeset servir:015-create-activity-occurrences
-- Origin codes: 1 = manual. Status codes: 1 = scheduled, 2 = cancelled.
CREATE TABLE activity_occurrences (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL,
    activity_id uuid NOT NULL,
    civil_date date NOT NULL,
    civil_time time(0) without time zone NOT NULL,
    time_zone_id varchar(255) NOT NULL,
    resolved_offset varchar(18) NOT NULL,
    scheduled_at timestamptz NOT NULL,
    origin smallint NOT NULL,
    revision integer NOT NULL,
    status smallint NOT NULL,
    CONSTRAINT activity_occurrences_activity_tenant_fk
        FOREIGN KEY (organization_id, activity_id)
        REFERENCES activities (organization_id, id),
    CONSTRAINT activity_occurrences_origin_known CHECK (origin = 1),
    CONSTRAINT activity_occurrences_revision_positive CHECK (revision > 0),
    CONSTRAINT activity_occurrences_status_known CHECK (status IN (1, 2))
);

CREATE UNIQUE INDEX activity_occurrences_current_instant_unique_idx
    ON activity_occurrences (organization_id, activity_id, scheduled_at)
    WHERE status = 1;

--rollback DROP TABLE activity_occurrences;
