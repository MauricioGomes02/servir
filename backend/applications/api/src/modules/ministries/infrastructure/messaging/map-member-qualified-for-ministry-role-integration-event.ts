import type { MemberQualifiedForMinistryRoleIntegrationEventV1 } from '../../application';
import type { MemberQualifiedForMinistryRole } from '../../domain';
export function mapMemberQualifiedForMinistryRoleIntegrationEvent(
  event: MemberQualifiedForMinistryRole,
): MemberQualifiedForMinistryRoleIntegrationEventV1 {
  return Object.freeze({
    channel: 'servir.ministries.events',
    source: 'urn:servir:ministries',
    type: 'servir.ministries.member.qualified-for-ministry-role.v1',
    name: 'member.qualified_for_ministry_role',
    version: 1,
    occurredAt: event.occurredAt.toISOString(),
    aggregateId: event.payload.ministryMembershipId,
    partitionKey: event.payload.organizationId,
    payload: Object.freeze({ ...event.payload, status: 'active' as const }),
    metadata: Object.freeze({}),
  });
}
