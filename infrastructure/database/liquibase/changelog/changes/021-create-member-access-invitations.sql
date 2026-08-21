--liquibase formatted sql

--changeset servir:021-create-member-access-invitations
CREATE TABLE member_access_invitations (
    id uuid PRIMARY KEY,
    organization_id uuid NOT NULL,
    member_id uuid NOT NULL,
    token_digest char(64) NOT NULL,
    expires_at timestamptz NOT NULL,
    status varchar(32) NOT NULL,
    CONSTRAINT member_access_invitations_organization_fk
        FOREIGN KEY (organization_id) REFERENCES organizations (id),
    CONSTRAINT member_access_invitations_member_tenant_fk
        FOREIGN KEY (organization_id, member_id) REFERENCES members (organization_id, id),
    CONSTRAINT member_access_invitations_token_digest_key UNIQUE (token_digest),
    CONSTRAINT member_access_invitations_token_digest_format
        CHECK (token_digest ~ '^[0-9a-f]{64}$'),
    CONSTRAINT member_access_invitations_status_known
        CHECK (status IN ('pending', 'accepted', 'revoked'))
);

CREATE INDEX member_access_invitations_organization_status_idx
    ON member_access_invitations (organization_id, status);

--rollback DROP TABLE member_access_invitations;
