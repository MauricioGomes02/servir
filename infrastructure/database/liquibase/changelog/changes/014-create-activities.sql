--liquibase formatted sql

--changeset servir:014-create-activities
-- Activity status codes: 1 = active, 2 = inactive.
CREATE TABLE activities (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL,
    name varchar(120) NOT NULL,
    status smallint NOT NULL,
    CONSTRAINT activities_organization_id_unique UNIQUE (organization_id, id),
    CONSTRAINT activities_organization_fk
        FOREIGN KEY (organization_id) REFERENCES organizations (id),
    CONSTRAINT activities_name_not_blank CHECK (length(btrim(name)) > 0),
    CONSTRAINT activities_status_known CHECK (status IN (1, 2))
);

CREATE UNIQUE INDEX activities_active_name_unique_idx
    ON activities (organization_id, lower(name))
    WHERE status = 1;

CREATE TABLE activity_ministries (
    organization_id uuid NOT NULL,
    activity_id uuid NOT NULL,
    ministry_id uuid NOT NULL,
    PRIMARY KEY (organization_id, activity_id, ministry_id),
    CONSTRAINT activity_ministries_activity_tenant_fk
        FOREIGN KEY (organization_id, activity_id)
        REFERENCES activities (organization_id, id),
    CONSTRAINT activity_ministries_ministry_tenant_fk
        FOREIGN KEY (organization_id, ministry_id)
        REFERENCES ministries (organization_id, id)
);

CREATE INDEX activity_ministries_ministry_idx
    ON activity_ministries (organization_id, ministry_id);

--rollback DROP TABLE activity_ministries; DROP TABLE activities;
