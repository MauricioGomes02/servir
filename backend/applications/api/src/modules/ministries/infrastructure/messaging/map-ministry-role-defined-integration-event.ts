import type { MinistryRoleDefinedIntegrationEventV1 } from '../../application';
import type { MinistryRoleDefined } from '../../domain';
export function mapMinistryRoleDefinedIntegrationEvent(event: MinistryRoleDefined): MinistryRoleDefinedIntegrationEventV1 {
  return Object.freeze({
    channel: 'servir.ministries.events', source: 'urn:servir:ministries',
    type: 'servir.ministries.ministry.role-defined.v1', name: 'ministry.role_defined', version: 1,
    occurredAt: event.occurredAt.toISOString(), aggregateId: event.payload.ministryId,
    partitionKey: event.payload.organizationId,
    payload: Object.freeze({ ...event.payload, status: 'active' as const }), metadata: Object.freeze({}),
  });
}
