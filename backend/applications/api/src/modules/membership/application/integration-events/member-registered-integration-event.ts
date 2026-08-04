import type { IntegrationEvent } from '@servir/integration-messaging';

export type MemberRegisteredIntegrationEventV1 = IntegrationEvent<
  'member.registered',
  1,
  Readonly<{
    memberId: string;
    organizationId: string;
    name: string;
    registeredAt: string;
  }>
>;
