--liquibase formatted sql
--changeset servir:009-create-ministry-role-qualifications
CREATE TABLE ministry_role_qualifications (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES organizations(id),
    ministry_id uuid NOT NULL REFERENCES ministries(id),
    ministry_membership_id uuid NOT NULL REFERENCES ministry_memberships(id),
    ministry_role_id uuid NOT NULL REFERENCES ministry_roles(id),
    status smallint NOT NULL CHECK (status IN (1, 2)),
    qualified_at timestamptz NOT NULL
);
CREATE UNIQUE INDEX uq_active_ministry_role_qualification ON ministry_role_qualifications (ministry_membership_id, ministry_role_id) WHERE status = 1;
