--liquibase formatted sql

--changeset servir:012-create-team-memberships
CREATE TABLE team_memberships (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL,
    ministry_id uuid NOT NULL,
    ministry_team_id uuid NOT NULL,
    ministry_membership_id uuid NOT NULL,
    status smallint NOT NULL,
    assigned_at timestamptz NOT NULL,
    CONSTRAINT team_memberships_team_fk FOREIGN KEY (organization_id, ministry_id, ministry_team_id) REFERENCES ministry_teams (organization_id, ministry_id, id),
    CONSTRAINT team_memberships_ministry_membership_fk FOREIGN KEY (organization_id, ministry_id, ministry_membership_id) REFERENCES ministry_memberships (organization_id, ministry_id, id),
    CONSTRAINT team_memberships_status_known CHECK (status IN (1,2))
);
CREATE UNIQUE INDEX team_memberships_active_unique_idx ON team_memberships (organization_id,ministry_id,ministry_team_id,ministry_membership_id) WHERE status=1;
