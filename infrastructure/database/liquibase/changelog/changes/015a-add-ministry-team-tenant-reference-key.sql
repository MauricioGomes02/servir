--liquibase formatted sql

--changeset servir:015a-add-ministry-team-tenant-reference-key
ALTER TABLE ministry_teams
    ADD CONSTRAINT ministry_teams_organization_id_unique
        UNIQUE (organization_id, id);

--rollback ALTER TABLE ministry_teams DROP CONSTRAINT ministry_teams_organization_id_unique;
