--liquibase formatted sql

--changeset servir:018-add-member-list-index
CREATE INDEX members_tenant_name_list_idx
    ON members (organization_id, lower(name), id);

--rollback DROP INDEX members_tenant_name_list_idx;
