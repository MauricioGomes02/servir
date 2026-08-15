--liquibase formatted sql

--changeset servir:019-create-users
CREATE TABLE users (
    id uuid PRIMARY KEY,
    status smallint NOT NULL,
    CONSTRAINT users_status_known CHECK (status IN (1, 2))
);

CREATE TABLE user_external_identities (
    user_id uuid NOT NULL,
    issuer varchar(255) NOT NULL,
    subject varchar(255) NOT NULL,
    CONSTRAINT user_external_identities_pk PRIMARY KEY (user_id, issuer, subject),
    CONSTRAINT user_external_identities_user_fk
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT user_external_identities_issuer_subject_key UNIQUE (issuer, subject),
    CONSTRAINT user_external_identities_issuer_not_empty CHECK (length(issuer) > 0),
    CONSTRAINT user_external_identities_subject_not_empty CHECK (length(subject) > 0)
);

--rollback DROP TABLE user_external_identities;
--rollback DROP TABLE users;
