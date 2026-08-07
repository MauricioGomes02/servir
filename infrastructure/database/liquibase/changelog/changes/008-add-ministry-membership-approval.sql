--liquibase formatted sql

--changeset servir:008-add-ministry-membership-approval
ALTER TABLE ministry_memberships ADD COLUMN approved_at timestamptz;

--rollback ALTER TABLE ministry_memberships DROP COLUMN approved_at;
