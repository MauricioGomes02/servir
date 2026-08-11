import type { MinistryId } from '@/modules/ministries/domain';
import type { OrganizationId } from '@/modules/organizations/domain';
import { failure, success, type Result } from '@/shared/core/result';
import { AggregateRoot } from '@/shared/domain/aggregate-root';
import { createDomainEvent, type DomainEventId } from '@/shared/domain/domain-event';
import type { Instant } from '@/shared/domain/instant';

import type { ActivityCreated } from './activity-created';
import { ActivityCreationPolicy, type ActivityCreationError } from './activity-creation-policy';
import type { ActivityId } from './activity-id';
import type { ActivityName } from './activity-name';

export type ActivityStatus = 'active' | 'inactive';

interface ActivityProps {
  readonly organizationId: OrganizationId;
  readonly name: ActivityName;
  readonly status: ActivityStatus;
  readonly ministryIds: readonly MinistryId[];
}

export class Activity extends AggregateRoot<ActivityId, ActivityProps, ActivityCreated> {
  private constructor(id: ActivityId, props: ActivityProps) {
    super(id, props);
  }

  static create(input: {
    readonly id: ActivityId;
    readonly organizationId: OrganizationId;
    readonly name: ActivityName;
    readonly ministryIds: readonly MinistryId[];
    readonly eventId: DomainEventId;
    readonly occurredAt: Instant;
  }): Result<Activity, ActivityCreationError> {
    const participants = new ActivityCreationPolicy().validateParticipants(input.ministryIds);
    if (!participants.success) return failure(participants.error);
    const activity = new Activity(input.id, {
      organizationId: input.organizationId,
      name: input.name,
      status: 'active',
      ministryIds: Object.freeze([...input.ministryIds]),
    });
    activity.recordDomainEvent(
      createDomainEvent({
        eventId: input.eventId,
        name: 'activity.created',
        occurredAt: input.occurredAt,
        payload: {
          activityId: input.id.toString(),
          organizationId: input.organizationId.toString(),
          name: input.name.toString(),
          ministryIds: input.ministryIds.map((id) => id.toString()),
        },
      }),
    );
    return success(activity);
  }

  static reconstitute(input: {
    readonly id: ActivityId;
    readonly organizationId: OrganizationId;
    readonly name: ActivityName;
    readonly status: ActivityStatus;
    readonly ministryIds: readonly MinistryId[];
  }): Activity {
    return new Activity(input.id, {
      organizationId: input.organizationId,
      name: input.name,
      status: input.status,
      ministryIds: Object.freeze([...input.ministryIds]),
    });
  }

  get organizationId(): OrganizationId {
    return this.props.organizationId;
  }

  get name(): ActivityName {
    return this.props.name;
  }

  get status(): ActivityStatus {
    return this.props.status;
  }

  get ministryIds(): readonly MinistryId[] {
    return Object.freeze([...this.props.ministryIds]);
  }
}
