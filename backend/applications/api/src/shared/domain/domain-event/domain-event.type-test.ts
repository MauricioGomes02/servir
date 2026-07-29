import { createDomainEvent } from '.';

// @ts-expect-error eventId e occurredAt sao obrigatorios.
createDomainEvent({
  name: 'organization.updated',
  payload: {
    organizationId: 'organization-123',
  },
});
