import {
  OrganizationId,
  type OrganizationIdError,
} from '@/modules/organizations/domain';
import type { Clock } from '@/shared/application/clock';
import type { ExecutionContext } from '@/shared/application/context';
import type { IdGenerator } from '@/shared/application/id-generator';
import {
  createLogRecord,
  LogLevels,
  type Logger,
  type LogAttributes,
  type LogLevel,
} from '@/shared/application/logging';
import {
  createEventEnvelope,
  type MessageId,
} from '@/shared/application/messaging';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import {
  success,
  type Result,
} from '@/shared/core/result';
import type { DomainEventId } from '@/shared/domain/domain-event';

import {
  Member,
  MemberRegistrationPolicy,
  type MemberId,
  type MemberNameError,
  type MemberRegistrationPolicyError,
} from '../../../domain';
import type {
  MemberWriteScope,
  OrganizationRegistrationFactsReader,
} from '../../ports';
import type { RegisterMemberCommand } from './register-member-command';

export interface RegisterMemberOutput {
  readonly memberId: MemberId;
  readonly organizationId: OrganizationId;
  readonly name: string;
}

export interface RegisterMemberDependencies {
  readonly clock: Clock;
  readonly memberIdGenerator: IdGenerator<MemberId>;
  readonly domainEventIdGenerator: IdGenerator<DomainEventId>;
  readonly messageIdGenerator: IdGenerator<MessageId>;
  readonly organizationRegistrationFacts:
    OrganizationRegistrationFactsReader;
  readonly registrationPolicy: MemberRegistrationPolicy;
  readonly unitOfWork: UnitOfWork<MemberWriteScope>;
  readonly logger: Logger;
}

type RegisterMemberError =
  | OrganizationIdError
  | MemberNameError
  | MemberRegistrationPolicyError;

export class RegisterMemberHandler {
  constructor(
    private readonly dependencies: RegisterMemberDependencies,
  ) {}

  async handle(
    command: RegisterMemberCommand,
    context: ExecutionContext,
  ): Promise<Result<RegisterMemberOutput, RegisterMemberError>> {
    this.log(LogLevels.Debug, 'member.registration.started', context, {});
    const organizationId = OrganizationId.create(command.organizationId);

    if (!organizationId.success) {
      this.logRejection(context, organizationId.error.code,
        organizationId.error.field);
      return organizationId;
    }

    this.log(LogLevels.Debug, 'member.registration.organization.validated',
      context, { 'organization.id': organizationId.value.value });

    const organization = await this.dependencies.organizationRegistrationFacts
      .findById(organizationId.value);
    const permission = this.dependencies.registrationPolicy.evaluate({
      organization,
    });

    if (!permission.success) {
      this.logRejection(context, permission.error.code, permission.error.field, {
        'organization.id': organizationId.value.value,
      });
      return permission;
    }

    this.log(LogLevels.Debug, 'member.registration.eligibility.accepted',
      context, { 'organization.id': organizationId.value.value });

    const member = Member.register({
      id: this.dependencies.memberIdGenerator.generate(),
      organizationId: organizationId.value,
      name: command.name,
      eventId: this.dependencies.domainEventIdGenerator.generate(),
      registeredAt: this.dependencies.clock.now(),
    });

    if (!member.success) {
      this.logRejection(context, member.error.code, member.error.field, {
        'organization.id': organizationId.value.value,
      });
      return member;
    }

    const pendingEvents = member.value.pendingDomainEvents;
    this.log(LogLevels.Debug, 'member.registration.validated', context, {
      'organization.id': organizationId.value.value,
      'member.id': member.value.id.value,
      'domain_event.count': pendingEvents.length,
    });
    const envelopes = pendingEvents.map((event) => createEventEnvelope({
      messageId: this.dependencies.messageIdGenerator.generate(),
      correlationId: context.correlationId,
      event,
    }));

    await this.dependencies.unitOfWork.execute(async (scope) => {
      await scope.members.save(member.value);
      await scope.outbox.add(envelopes);
    });

    this.log(LogLevels.Info, 'member.registration.persisted', context, {
      'organization.id': organizationId.value.value,
      'member.id': member.value.id.value,
      'domain_event.count': pendingEvents.length,
    });

    member.value.acknowledgeDomainEvents(pendingEvents);

    this.log(LogLevels.Info, 'member.registration.completed', context, {
      'organization.id': organizationId.value.value,
      'member.id': member.value.id.value,
    });

    return success(Object.freeze({
      memberId: member.value.id,
      organizationId: member.value.organizationId,
      name: member.value.name.toString(),
    }));
  }

  private logRejection(
    context: ExecutionContext,
    code: string,
    field?: string,
    attributes: LogAttributes = {},
  ): void {
    this.log(LogLevels.Info, 'member.registration.rejected', context, {
      ...attributes,
      'error.code': code,
      ...(field === undefined ? {} : { 'error.field': field }),
    });
  }

  private log(
    level: LogLevel,
    eventName: string,
    context: ExecutionContext,
    attributes: LogAttributes,
  ): void {
    this.dependencies.logger.log(createLogRecord({
      level,
      eventName,
      context,
      attributes,
    }));
  }
}
