--liquibase formatted sql

--changeset servir:003-create-members
-- Member status codes: 1 = active, 2 = inactive.
CREATE TABLE members (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL,
    name varchar(120) NOT NULL,
    status smallint NOT NULL,
    registered_at timestamptz NOT NULL,
    CONSTRAINT members_organization_fk
        FOREIGN KEY (organization_id) REFERENCES organizations (id),
    CONSTRAINT members_name_not_blank
        CHECK (length(btrim(name)) > 0),
    CONSTRAINT members_status_known
        CHECK (status IN (1, 2))
);

CREATE INDEX members_organization_id_idx
    ON members (organization_id);

--rollback DROP TABLE members;
