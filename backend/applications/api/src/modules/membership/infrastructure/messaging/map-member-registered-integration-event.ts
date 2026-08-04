import type { MemberRegisteredIntegrationEventV1 } from '@/modules/membership/application';
import type { MemberRegistered } from '@/modules/membership/domain';

export function mapMemberRegisteredIntegrationEvent(
  event: MemberRegistered,
): MemberRegisteredIntegrationEventV1 {
  const registeredAt = event.occurredAt.toISOString();

  return Object.freeze({
    channel: 'servir.membership.events',
    source: 'urn:servir:membership',
    type: 'servir.membership.member.registered.v1',
    name: 'member.registered',
    version: 1,
    occurredAt: registeredAt,
    aggregateId: event.payload.memberId,
    partitionKey: event.payload.organizationId,
    payload: Object.freeze({
      memberId: event.payload.memberId,
      organizationId: event.payload.organizationId,
      name: event.payload.name,
      registeredAt,
    }),
    metadata: Object.freeze({}),
  });
}
