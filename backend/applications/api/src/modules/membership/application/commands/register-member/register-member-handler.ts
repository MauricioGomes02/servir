import {
  OrganizationId,
  type OrganizationIdError,
} from '@/modules/organizations/domain';
import type { Clock } from '@/shared/application/clock';
import type { ExecutionContext } from '@/shared/application/context';
import type { IdGenerator } from '@/shared/application/id-generator';
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
    const organizationId = OrganizationId.create(command.organizationId);

    if (!organizationId.success) {
      return organizationId;
    }

    const organization = await this.dependencies.organizationRegistrationFacts
      .findById(organizationId.value);
    const permission = this.dependencies.registrationPolicy.evaluate({
      organization,
    });

    if (!permission.success) {
      return permission;
    }

    const member = Member.register({
      id: this.dependencies.memberIdGenerator.generate(),
      organizationId: organizationId.value,
      name: command.name,
      eventId: this.dependencies.domainEventIdGenerator.generate(),
      registeredAt: this.dependencies.clock.now(),
    });

    if (!member.success) {
      return member;
    }

    const pendingEvents = member.value.pendingDomainEvents;
    const envelopes = pendingEvents.map((event) => createEventEnvelope({
      messageId: this.dependencies.messageIdGenerator.generate(),
      correlationId: context.correlationId,
      event,
    }));

    await this.dependencies.unitOfWork.execute(async (scope) => {
      await scope.members.save(member.value);
      await scope.outbox.add(envelopes);
    });

    member.value.acknowledgeDomainEvents(pendingEvents);

    return success(Object.freeze({
      memberId: member.value.id,
      organizationId: member.value.organizationId,
      name: member.value.name.toString(),
    }));
  }
}
