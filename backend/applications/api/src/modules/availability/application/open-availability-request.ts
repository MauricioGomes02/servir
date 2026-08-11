import { MinistryTeamId, type MinistryTeamIdError } from '@/modules/ministries/domain';
import { OrganizationId, type OrganizationIdError } from '@/modules/organizations/domain';
import type { Clock } from '@/shared/application/clock';
import type { ExecutionContext } from '@/shared/application/context';
import type { IdGenerator } from '@/shared/application/id-generator';
import {
  createEventEnvelope,
  type EventOutbox,
  type MessageId,
} from '@/shared/application/messaging';
import { defineMessage } from '@/shared/application/mediator';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { combineValidationResults, type ValidationErrors } from '@/shared/application/validation';
import { failure, success, type Result } from '@/shared/core/result';
import type { DomainEventId } from '@/shared/domain/domain-event';
import { Instant, type InstantError } from '@/shared/domain/instant';
import type { NotificationError } from '@/shared/domain/notification';
import {
  CivilDate,
  SchedulePeriod,
  type CivilDateError,
  type SchedulePeriodError,
} from '@/shared/domain/temporal';
import type { IntegrationEvent } from '@servir/integration-messaging';
import {
  AvailabilityRequest,
  type AvailabilityRequestId,
  type AvailabilityRequestOpeningError,
  type AvailabilityRequestOpeningFacts,
  type AvailabilityRequestOpeningPolicy,
} from '../domain';

function atField<TValue, TError extends NotificationError>(
  result: Result<TValue, TError>,
  field: string,
): Result<TValue, TError> {
  return result.success ? result : failure(Object.freeze({ ...result.error, field }) as TError);
}

export interface AvailabilityRequestOpeningFactsReader {
  find(
    organizationId: OrganizationId,
    ministryTeamId: MinistryTeamId,
  ): Promise<AvailabilityRequestOpeningFacts>;
}
export interface AvailabilityRequestRepository {
  add(request: AvailabilityRequest): Promise<Result<void, never>>;
}
export interface AvailabilityRequestWriteScope {
  readonly availabilityRequests: AvailabilityRequestRepository;
  readonly outbox: EventOutbox;
}
export interface OpenAvailabilityRequestCommand {
  readonly organizationId: unknown;
  readonly ministryTeamId: unknown;
  readonly startDate: unknown;
  readonly endDate: unknown;
  readonly respondBy: unknown;
}
export interface OpenAvailabilityRequestOutput {
  readonly availabilityRequestId: AvailabilityRequestId;
  readonly organizationId: OrganizationId;
  readonly ministryTeamId: MinistryTeamId;
  readonly startDate: string;
  readonly endDate: string;
  readonly respondBy: string;
  readonly status: 'open';
}
export type OpenAvailabilityRequestError =
  | OrganizationIdError
  | MinistryTeamIdError
  | CivilDateError
  | SchedulePeriodError
  | InstantError
  | AvailabilityRequestOpeningError
  | ValidationErrors;

export class OpenAvailabilityRequestHandler {
  constructor(
    private readonly dependencies: {
      clock: Clock;
      availabilityRequestIdGenerator: IdGenerator<AvailabilityRequestId>;
      domainEventIdGenerator: IdGenerator<DomainEventId>;
      messageIdGenerator: IdGenerator<MessageId>;
      facts: AvailabilityRequestOpeningFactsReader;
      policy: AvailabilityRequestOpeningPolicy;
      unitOfWork: UnitOfWork<AvailabilityRequestWriteScope>;
    },
  ) {}

  async handle(
    command: OpenAvailabilityRequestCommand,
    context: ExecutionContext,
  ): Promise<Result<OpenAvailabilityRequestOutput, OpenAvailabilityRequestError>> {
    const validated = combineValidationResults(
      OrganizationId.create(command.organizationId),
      MinistryTeamId.create(command.ministryTeamId),
      atField(CivilDate.create(command.startDate), 'startDate'),
      atField(CivilDate.create(command.endDate), 'endDate'),
      atField(Instant.create(command.respondBy), 'respondBy'),
    );
    if (!validated.success) return validated;
    const [organizationId, ministryTeamId, startDate, endDate, respondBy] = validated.value;
    const period = SchedulePeriod.create(startDate, endDate);
    if (!period.success) return period;
    const now = this.dependencies.clock.now();
    const allowed = this.dependencies.policy.evaluate(
      await this.dependencies.facts.find(organizationId, ministryTeamId),
      respondBy,
      now,
    );
    if (!allowed.success) return allowed;
    const request = AvailabilityRequest.open({
      id: this.dependencies.availabilityRequestIdGenerator.generate(),
      organizationId,
      ministryTeamId,
      period: period.value,
      respondBy,
      eventId: this.dependencies.domainEventIdGenerator.generate(),
      occurredAt: now,
    });
    if (!request.success) return request;
    const events = request.value.pendingDomainEvents;
    const persisted = await this.dependencies.unitOfWork.execute(async (scope) => {
      const added = await scope.availabilityRequests.add(request.value);
      if (!added.success) return added;
      await scope.outbox.add(
        events.map((event) =>
          createEventEnvelope({
            messageId: this.dependencies.messageIdGenerator.generate(),
            correlationId: context.correlationId,
            event,
          }),
        ),
      );
      return success();
    });
    if (!persisted.success) return persisted;
    request.value.acknowledgeDomainEvents(events);
    return success(
      Object.freeze({
        availabilityRequestId: request.value.id,
        organizationId: request.value.organizationId,
        ministryTeamId: request.value.ministryTeamId,
        startDate: request.value.period.startDate.toISOString(),
        endDate: request.value.period.endDate.toISOString(),
        respondBy: request.value.respondBy.toISOString(),
        status: request.value.status,
      }),
    );
  }
}

export const OpenAvailabilityRequestMessage = defineMessage<
  OpenAvailabilityRequestCommand,
  Awaited<ReturnType<OpenAvailabilityRequestHandler['handle']>>
>('availability.open-request', 'OpenAvailabilityRequest');
export type AvailabilityRequestOpenedIntegrationEventV1 = IntegrationEvent<
  'availability_request.opened',
  1,
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
