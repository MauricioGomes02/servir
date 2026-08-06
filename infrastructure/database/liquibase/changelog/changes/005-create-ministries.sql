--liquibase formatted sql

--changeset servir:005-create-ministries
-- Ministry status codes: 1 = active, 2 = inactive.
CREATE TABLE ministries (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL,
    name varchar(120) NOT NULL,
    status smallint NOT NULL,
    CONSTRAINT ministries_organization_fk
        FOREIGN KEY (organization_id) REFERENCES organizations (id),
    CONSTRAINT ministries_name_not_blank
        CHECK (length(btrim(name)) > 0),
    CONSTRAINT ministries_status_known
        CHECK (status IN (1, 2))
);

CREATE INDEX ministries_organization_id_idx
    ON ministries (organization_id);

CREATE UNIQUE INDEX ministries_active_name_unique_idx
    ON ministries (organization_id, lower(name))
    WHERE status = 1;

--rollback DROP TABLE ministries;
