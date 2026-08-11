--liquibase formatted sql

--changeset servir:013-create-team-leaderships
ALTER TABLE team_memberships ADD CONSTRAINT team_memberships_tenant_identity_unique UNIQUE (organization_id, ministry_id, ministry_team_id, id);
CREATE TABLE team_leaderships (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL,
    ministry_id uuid NOT NULL,
    ministry_team_id uuid NOT NULL,
    team_membership_id uuid NOT NULL,
    status smallint NOT NULL,
    appointed_at timestamptz NOT NULL,
    CONSTRAINT team_leaderships_team_fk FOREIGN KEY (organization_id, ministry_id, ministry_team_id) REFERENCES ministry_teams (organization_id, ministry_id, id),
    CONSTRAINT team_leaderships_membership_fk FOREIGN KEY (organization_id, ministry_id, ministry_team_id, team_membership_id) REFERENCES team_memberships (organization_id, ministry_id, ministry_team_id, id),
    CONSTRAINT team_leaderships_status_known CHECK (status IN (1,2))
);
CREATE UNIQUE INDEX team_leaderships_active_team_unique_idx ON team_leaderships (organization_id,ministry_id,ministry_team_id) WHERE status=1;
