--liquibase formatted sql

--changeset servir:006-create-ministry-roles
-- Ministry role status codes: 1 = active, 2 = inactive.
CREATE TABLE ministry_roles (
    id uuid PRIMARY KEY,
    ministry_id uuid NOT NULL,
    name varchar(120) NOT NULL,
    status smallint NOT NULL,
    CONSTRAINT ministry_roles_ministry_fk FOREIGN KEY (ministry_id) REFERENCES ministries (id),
    CONSTRAINT ministry_roles_name_not_blank CHECK (length(btrim(name)) > 0),
    CONSTRAINT ministry_roles_status_known CHECK (status IN (1, 2))
);

CREATE INDEX ministry_roles_ministry_id_idx ON ministry_roles (ministry_id);
CREATE UNIQUE INDEX ministry_roles_active_name_unique_idx
    ON ministry_roles (ministry_id, lower(name)) WHERE status = 1;

--rollback DROP TABLE ministry_roles;
