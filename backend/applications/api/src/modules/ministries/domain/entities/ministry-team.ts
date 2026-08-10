import type { OrganizationId } from '@/modules/organizations/domain';
import { failure, success, type Result } from '@/shared/core/result';
import { AggregateRoot } from '@/shared/domain/aggregate-root';
import type { DomainEventId } from '@/shared/domain/domain-event';
import type { Instant } from '@/shared/domain/instant';
import { createMinistryTeamCreated, type MinistryTeamCreated } from '../events';
import { MinistryTeamName, type MinistryTeamNameError } from '../value-objects';
import type { MinistryId } from './ministry-id';
import type { MinistryTeamId } from './ministry-team-id';
export type MinistryTeamStatus = 'active' | 'inactive';
interface Props {
  readonly organizationId: OrganizationId;
  readonly ministryId: MinistryId;
  readonly name: MinistryTeamName;
  readonly status: MinistryTeamStatus;
}
export class MinistryTeam extends AggregateRoot<MinistryTeamId, Props, MinistryTeamCreated> {
  private constructor(id: MinistryTeamId, props: Props) {
    super(id, props);
  }
  static create(input: {
    id: MinistryTeamId;
    organizationId: OrganizationId;
    ministryId: MinistryId;
    name: unknown;
    eventId: DomainEventId;
    occurredAt: Instant;
  }): Result<MinistryTeam, MinistryTeamNameError> {
    const name = MinistryTeamName.create(input.name);
    if (!name.success) return failure(name.error);
    const team = new MinistryTeam(input.id, {
      organizationId: input.organizationId,
      ministryId: input.ministryId,
      name: name.value,
      status: 'active',
    });
    team.recordDomainEvent(
      createMinistryTeamCreated({ ...input, ministryTeamId: input.id, name: name.value }),
    );
    return success(team);
  }
  static reconstitute(input: {
    id: MinistryTeamId;
    organizationId: OrganizationId;
    ministryId: MinistryId;
    name: MinistryTeamName;
    status: MinistryTeamStatus;
  }) {
    return new MinistryTeam(input.id, input);
  }
  get organizationId() {
    return this.props.organizationId;
  }
  get ministryId() {
    return this.props.ministryId;
  }
  get name() {
    return this.props.name;
  }
  get status() {
    return this.props.status;
  }
}
