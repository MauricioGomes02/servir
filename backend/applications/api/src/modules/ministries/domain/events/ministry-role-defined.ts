import { createDomainEvent, type DomainEvent, type DomainEventId } from '@/shared/domain/domain-event';
import type { Instant } from '@/shared/domain/instant';
import type { OrganizationId } from '@/modules/organizations/domain';
import type { MinistryId, MinistryRoleId } from '../entities';
import type { MinistryRoleName } from '../value-objects';

export type MinistryRoleDefined = DomainEvent<'ministry.role_defined', Readonly<{
  ministryId: string; organizationId: string; ministryRoleId: string; name: string;
}>>;
export function createMinistryRoleDefined(input: {
  eventId: DomainEventId; occurredAt: Instant; ministryId: MinistryId; organizationId: OrganizationId;
  ministryRoleId: MinistryRoleId; name: MinistryRoleName;
}): MinistryRoleDefined {
  return createDomainEvent({
    eventId: input.eventId,
    name: 'ministry.role_defined',
    occurredAt: input.occurredAt,
    payload: {
      ministryId: input.ministryId.toString(), organizationId: input.organizationId.toString(),
      ministryRoleId: input.ministryRoleId.toString(), name: input.name.toString(),
    },
  });
}
export function isMinistryRoleDefined(event: DomainEvent): event is MinistryRoleDefined { return event.name === 'ministry.role_defined'; }
