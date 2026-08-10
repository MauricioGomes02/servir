--liquibase formatted sql

--changeset servir:010-enforce-organization-tenant-boundaries
ALTER TABLE ministry_roles ADD COLUMN organization_id uuid;

UPDATE ministry_roles AS role
SET organization_id = ministry.organization_id
FROM ministries AS ministry
WHERE ministry.id = role.ministry_id;

ALTER TABLE ministry_roles ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE members
    ADD CONSTRAINT members_organization_id_unique UNIQUE (organization_id, id);
ALTER TABLE ministries
    ADD CONSTRAINT ministries_organization_id_unique UNIQUE (organization_id, id);
ALTER TABLE ministry_roles
    ADD CONSTRAINT ministry_roles_organization_ministry_id_unique
        UNIQUE (organization_id, ministry_id, id);
ALTER TABLE ministry_memberships
    ADD CONSTRAINT ministry_memberships_organization_ministry_id_unique
        UNIQUE (organization_id, ministry_id, id);

ALTER TABLE ministry_roles
    DROP CONSTRAINT ministry_roles_ministry_fk,
    ADD CONSTRAINT ministry_roles_organization_ministry_fk
        FOREIGN KEY (organization_id, ministry_id)
        REFERENCES ministries (organization_id, id);
ALTER TABLE ministry_memberships
    DROP CONSTRAINT ministry_memberships_organization_fk,
    DROP CONSTRAINT ministry_memberships_ministry_fk,
    DROP CONSTRAINT ministry_memberships_member_fk,
    ADD CONSTRAINT ministry_memberships_organization_ministry_fk
        FOREIGN KEY (organization_id, ministry_id)
        REFERENCES ministries (organization_id, id),
    ADD CONSTRAINT ministry_memberships_organization_member_fk
        FOREIGN KEY (organization_id, member_id)
        REFERENCES members (organization_id, id);
ALTER TABLE ministry_role_qualifications
    DROP CONSTRAINT ministry_role_qualifications_organization_id_fkey,
    DROP CONSTRAINT ministry_role_qualifications_ministry_id_fkey,
    DROP CONSTRAINT ministry_role_qualifications_ministry_membership_id_fkey,
    DROP CONSTRAINT ministry_role_qualifications_ministry_role_id_fkey,
    ADD CONSTRAINT ministry_role_qualifications_membership_tenant_fk
        FOREIGN KEY (organization_id, ministry_id, ministry_membership_id)
        REFERENCES ministry_memberships (organization_id, ministry_id, id),
    ADD CONSTRAINT ministry_role_qualifications_role_tenant_fk
        FOREIGN KEY (organization_id, ministry_id, ministry_role_id)
        REFERENCES ministry_roles (organization_id, ministry_id, id);

DROP INDEX ministry_roles_active_name_unique_idx;
CREATE UNIQUE INDEX ministry_roles_active_name_unique_idx
    ON ministry_roles (organization_id, ministry_id, lower(name))
    WHERE status = 1;

DROP INDEX ministry_memberships_current_unique_idx;
CREATE UNIQUE INDEX ministry_memberships_current_unique_idx
    ON ministry_memberships (organization_id, ministry_id, member_id)
    WHERE status IN (1, 2);

DROP INDEX uq_active_ministry_role_qualification;
CREATE UNIQUE INDEX ministry_role_qualifications_active_unique_idx
    ON ministry_role_qualifications (
        organization_id,
        ministry_id,
        ministry_membership_id,
        ministry_role_id
    )
    WHERE status = 1;

DROP INDEX members_organization_id_idx;
DROP INDEX ministries_organization_id_idx;
DROP INDEX ministry_roles_ministry_id_idx;
DROP INDEX ministry_memberships_organization_id_idx;
DROP INDEX ministry_memberships_member_id_idx;

CREATE INDEX ministry_memberships_organization_member_id_idx
    ON ministry_memberships (organization_id, member_id);
CREATE INDEX ministry_role_qualifications_membership_idx
    ON ministry_role_qualifications (organization_id, ministry_id, ministry_membership_id);
