import type { DomainEvent } from '@/shared/domain/domain-event';

export type ActivityCreated = DomainEvent<
  'activity.created',
  Readonly<{
    activityId: string;
    organizationId: string;
    name: string;
    ministryIds: readonly string[];
  }>
>;
