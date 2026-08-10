--liquibase formatted sql

--changeset servir:011-create-ministry-teams
CREATE TABLE ministry_teams (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL,
    ministry_id uuid NOT NULL,
    name varchar(120) NOT NULL,
    status smallint NOT NULL,
    CONSTRAINT ministry_teams_organization_ministry_id_unique UNIQUE (organization_id, ministry_id, id),
    CONSTRAINT ministry_teams_organization_ministry_fk FOREIGN KEY (organization_id, ministry_id) REFERENCES ministries (organization_id, id),
    CONSTRAINT ministry_teams_name_not_blank CHECK (length(btrim(name)) > 0),
    CONSTRAINT ministry_teams_status_known CHECK (status IN (1, 2))
);
CREATE UNIQUE INDEX ministry_teams_active_name_unique_idx ON ministry_teams (organization_id, ministry_id, lower(name)) WHERE status = 1;
