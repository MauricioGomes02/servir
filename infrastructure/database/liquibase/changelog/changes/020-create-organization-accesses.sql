--liquibase formatted sql

--changeset servir:020-create-organization-accesses
CREATE TABLE organization_accesses (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL,
    user_id uuid NOT NULL,
    member_id uuid,
    role varchar(32) NOT NULL,
    status varchar(32) NOT NULL,
    CONSTRAINT organization_accesses_organization_fk
        FOREIGN KEY (organization_id) REFERENCES organizations (id),
    CONSTRAINT organization_accesses_user_fk
        FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT organization_accesses_member_tenant_fk
        FOREIGN KEY (organization_id, member_id) REFERENCES members (organization_id, id),
    CONSTRAINT organization_accesses_role_known CHECK (role IN ('owner')),
    CONSTRAINT organization_accesses_status_known CHECK (status IN ('active', 'revoked'))
);

CREATE UNIQUE INDEX organization_accesses_current_user_key
    ON organization_accesses (organization_id, user_id)
    WHERE status = 'active';

CREATE UNIQUE INDEX organization_accesses_current_member_key
    ON organization_accesses (organization_id, member_id)
    WHERE status = 'active' AND member_id IS NOT NULL;

--rollback DROP TABLE organization_accesses;
