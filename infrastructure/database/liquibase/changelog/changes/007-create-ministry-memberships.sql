--liquibase formatted sql

--changeset servir:007-create-ministry-memberships
-- Ministry membership status codes: 1 = requested, 2 = active, 3 = rejected, 4 = suspended, 5 = ended.
CREATE TABLE ministry_memberships (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL,
    ministry_id uuid NOT NULL,
    member_id uuid NOT NULL,
    status smallint NOT NULL,
    requested_at timestamptz NOT NULL,
    CONSTRAINT ministry_memberships_organization_fk
        FOREIGN KEY (organization_id) REFERENCES organizations (id),
    CONSTRAINT ministry_memberships_ministry_fk
        FOREIGN KEY (ministry_id) REFERENCES ministries (id),
    CONSTRAINT ministry_memberships_member_fk
        FOREIGN KEY (member_id) REFERENCES members (id),
    CONSTRAINT ministry_memberships_status_known
        CHECK (status IN (1, 2, 3, 4, 5))
);

CREATE INDEX ministry_memberships_organization_id_idx
    ON ministry_memberships (organization_id);
CREATE INDEX ministry_memberships_member_id_idx
    ON ministry_memberships (member_id);
CREATE UNIQUE INDEX ministry_memberships_current_unique_idx
    ON ministry_memberships (ministry_id, member_id) WHERE status IN (1, 2);

--rollback DROP TABLE ministry_memberships;
