--liquibase formatted sql

--changeset servir:016-create-availability-requests
-- Status codes: 1 = open, 2 = closed.
CREATE TABLE availability_requests (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL,
    ministry_team_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    respond_by timestamptz NOT NULL,
    status smallint NOT NULL,
    CONSTRAINT availability_requests_team_tenant_fk
        FOREIGN KEY (organization_id, ministry_team_id)
        REFERENCES ministry_teams (organization_id, id),
    CONSTRAINT availability_requests_period_order CHECK (start_date <= end_date),
    CONSTRAINT availability_requests_status_known CHECK (status IN (1, 2))
);

CREATE INDEX availability_requests_team_period_idx
    ON availability_requests (organization_id, ministry_team_id, start_date, end_date);

--rollback DROP TABLE availability_requests;
