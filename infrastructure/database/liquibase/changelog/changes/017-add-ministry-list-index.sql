--liquibase formatted sql

--changeset servir:017-add-ministry-list-index
CREATE INDEX ministries_tenant_name_list_idx
    ON ministries (organization_id, lower(name), id);

--rollback DROP INDEX ministries_tenant_name_list_idx;
