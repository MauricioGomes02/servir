import type { MinistryTeamId } from '@/modules/ministries/domain';
import type { OrganizationId } from '@/modules/organizations/domain';
import { failure, success, type Result } from '@/shared/core/result';
import { AggregateRoot } from '@/shared/domain/aggregate-root';
import {
  createDomainEvent,
  type DomainEvent,
  type DomainEventId,
} from '@/shared/domain/domain-event';
import { EntityId, validateEntityId } from '@/shared/domain/entity';
import type { Instant } from '@/shared/domain/instant';
import type { NotificationError } from '@/shared/domain/notification';
import type { SchedulePeriod } from '@/shared/domain/temporal';
import {
  AvailabilityRequestOpeningErrorCodes,
  type AvailabilityRequestOpeningError,
} from './availability-request-opening-policy';

export const AvailabilityRequestIdErrorCodes = {
  InvalidType: 'availability_request.id.invalid_type',
  Empty: 'availability_request.id.empty',
  TooLong: 'availability_request.id.too_long',
  InvalidFormat: 'availability_request.id.invalid_format',
} as const;
export type AvailabilityRequestIdError = NotificationError<
  (typeof AvailabilityRequestIdErrorCodes)[keyof typeof AvailabilityRequestIdErrorCodes]
>;

export class AvailabilityRequestId extends EntityId<'AvailabilityRequestId'> {
  private constructor(value: string) {
    super(value);
    Object.freeze(this);
  }

  static create(input: unknown): Result<AvailabilityRequestId, AvailabilityRequestIdError> {
    const result = validateEntityId(
      input,
      'availabilityRequestId',
      AvailabilityRequestIdErrorCodes,
    );
    return result.success ? success(new AvailabilityRequestId(result.value)) : result;
  }
}

export type AvailabilityRequestOpened = DomainEvent<
  'availability_request.opened',
  Readonly<{
    availabilityRequestId: string;
    organizationId: string;
    ministryTeamId: string;
    startDate: string;
    endDate: string;
    respondBy: string;
    status: 'open';
  }>
>;

interface Props {
  readonly organizationId: OrganizationId;
  readonly ministryTeamId: MinistryTeamId;
  readonly period: SchedulePeriod;
  readonly respondBy: Instant;
  readonly status: 'open';
}

export class AvailabilityRequest extends AggregateRoot<
  AvailabilityRequestId,
  Props,
  AvailabilityRequestOpened
> {
  private constructor(id: AvailabilityRequestId, props: Props) {
    super(id, props);
  }

  static open(input: {
    readonly id: AvailabilityRequestId;
    readonly organizationId: OrganizationId;
    readonly ministryTeamId: MinistryTeamId;
    readonly period: SchedulePeriod;
    readonly respondBy: Instant;
    readonly eventId: DomainEventId;
    readonly occurredAt: Instant;
  }): Result<AvailabilityRequest, AvailabilityRequestOpeningError> {
    if (input.respondBy.toEpochMilliseconds() <= input.occurredAt.toEpochMilliseconds())
      return failure({
        code: AvailabilityRequestOpeningErrorCodes.ResponseDeadlineNotFuture,
        field: 'respondBy',
      });
    const request = new AvailabilityRequest(input.id, {
      organizationId: input.organizationId,
      ministryTeamId: input.ministryTeamId,
      period: input.period,
      respondBy: input.respondBy,
      status: 'open',
    });
    request.recordDomainEvent(
      createDomainEvent({
        eventId: input.eventId,
        name: 'availability_request.opened',
        occurredAt: input.occurredAt,
        payload: {
          availabilityRequestId: input.id.toString(),
          organizationId: input.organizationId.toString(),
          ministryTeamId: input.ministryTeamId.toString(),
          startDate: input.period.startDate.toISOString(),
          endDate: input.period.endDate.toISOString(),
          respondBy: input.respondBy.toISOString(),
          status: 'open',
        },
      }),
    );
    return success(request);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get ministryTeamId() {
    return this.props.ministryTeamId;
  }
  get period() {
    return this.props.period;
  }
  get respondBy() {
    return this.props.respondBy;
  }
  get status() {
    return this.props.status;
  }
}
