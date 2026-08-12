import {
  createMemberDetails,
  type MemberDetails,
  type MemberDetailsReader,
  type MemberListReader,
  type MemberRepository,
  type OrganizationRegistrationFactsReader,
} from '@/modules/membership/application';
import type { Member, MemberId, OrganizationRegistrationFacts } from '@/modules/membership/domain';
import type {
  OrganizationDetailsReader,
  OrganizationRepository,
} from '@/modules/organizations/application';
import type { Organization, OrganizationId } from '@/modules/organizations/domain';
import type {
  MinistryCreationFactsReader,
  MinistryListReader,
  MinistryMembershipRepository,
  MinistryMembershipRequestFactsReader,
  MinistryRoleQualificationFactsReader,
  MinistryRepository,
  MinistryTeamCreationFactsReader,
  MinistryTeamRepository,
  TeamMembershipAssignmentFactsReader,
  TeamMembershipRepository,
  TeamLeaderAppointmentFactsReader,
  TeamLeadershipRepository,
} from '@/modules/ministries/application';
import {
  Ministry,
  MinistryCreationPolicy,
  MinistryMembershipRequestPolicyErrorCodes,
  MinistryRoleDefinitionErrorCodes,
  MinistryTeamCreationPolicyErrorCodes,
  TeamMembershipAssignmentPolicyErrorCodes,
  TeamLeaderAppointmentPolicyErrorCodes,
  type MinistryId,
  type MinistryMembership,
  type MinistryName,
  type MinistryTeam,
  type MinistryTeamName,
  type TeamMembership,
  type TeamLeadership,
} from '@/modules/ministries/domain';
import { failure, success } from '@/shared/core/result';

export class InMemoryOrganizationRepository implements OrganizationRepository {
  private readonly stored: Organization[] = [];
  async save(organization: Organization): Promise<void> {
    this.stored.push(organization);
  }
  get organizations(): readonly Organization[] {
    return Object.freeze([...this.stored]);
  }
}
export class InMemoryOrganizationDetailsReader implements OrganizationDetailsReader {
  constructor(private readonly organizations: () => readonly Organization[]) {}
  async findById(organizationId: OrganizationId) {
    const organization = this.organizations().find((item) => item.id.equals(organizationId));
    return organization === undefined
      ? undefined
      : Object.freeze({ id: organization.id, name: organization.name.toString() });
  }
}
export class InMemoryMemberRepository implements MemberRepository {
  private readonly stored: Member[] = [];
  async save(member: Member): Promise<void> {
    this.stored.push(member);
  }
  get members(): readonly Member[] {
    return Object.freeze([...this.stored]);
  }
}
export class InMemoryMemberDetailsReader implements MemberDetailsReader {
  constructor(private readonly members: () => readonly Member[]) {}
  async findById(
    organizationId: OrganizationId,
    memberId: MemberId,
  ): Promise<MemberDetails | undefined> {
    const member = this.members().find(
      (candidate) =>
        candidate.id.equals(memberId) && candidate.organizationId.equals(organizationId),
    );
    return member === undefined
      ? undefined
      : createMemberDetails({
          id: member.id,
          organizationId: member.organizationId,
          name: member.name.toString(),
          status: member.status,
        });
  }
}
export class InMemoryMemberListReader implements MemberListReader {
  constructor(
    private readonly organizationIds: () => readonly OrganizationId[],
    private readonly members: () => readonly Member[],
  ) {}
  async list(criteria: Parameters<MemberListReader['list']>[0]) {
    if (!this.organizationIds().some((id) => id.equals(criteria.organizationId))) return undefined;
    const filtered = this.members()
      .filter((item) => item.organizationId.equals(criteria.organizationId))
      .filter((item) => criteria.status === undefined || item.status === criteria.status)
      .filter(
        (item) =>
          criteria.search === undefined ||
          item.name
            .toString()
            .toLocaleLowerCase('pt-BR')
            .startsWith(criteria.search.toLocaleLowerCase('pt-BR')),
      )
      .sort(
        (left, right) =>
          left.name.toString().toLowerCase().localeCompare(right.name.toString().toLowerCase()) ||
          left.id.toString().localeCompare(right.id.toString()),
      );
    const start = (criteria.page - 1) * criteria.pageSize;
    return Object.freeze({
      items: Object.freeze(
        filtered
          .slice(start, start + criteria.pageSize)
          .map((item) =>
            Object.freeze({ id: item.id, name: item.name.toString(), status: item.status }),
          ),
      ),
      pagination: Object.freeze({
        page: criteria.page,
        pageSize: criteria.pageSize,
        totalItems: filtered.length,
        totalPages: filtered.length === 0 ? 0 : Math.ceil(filtered.length / criteria.pageSize),
      }),
    });
  }
}
export class InMemoryOrganizationRegistrationFactsReader implements OrganizationRegistrationFactsReader {
  private readonly source: () => readonly OrganizationId[];
  constructor(source: readonly OrganizationId[] | (() => readonly OrganizationId[])) {
    if (typeof source === 'function') this.source = source;
    else {
      const snapshot = Object.freeze([...source]);
      this.source = () => snapshot;
    }
  }
  async findById(
    organizationId: OrganizationId,
  ): Promise<OrganizationRegistrationFacts | undefined> {
    const found = this.source().find((candidate) => candidate.equals(organizationId));
    return found === undefined ? undefined : Object.freeze({ organizationId: found });
  }
}
export class InMemoryMinistryRepository implements MinistryRepository {
  private readonly stored: Ministry[] = [];
  async add(ministry: Ministry) {
    const conflict = this.stored.some(
      (candidate) =>
        candidate.organizationId.equals(ministry.organizationId) &&
        candidate.status === 'active' &&
        candidate.name.toString().toLowerCase() === ministry.name.toString().toLowerCase(),
    );
    if (conflict) return failure(new MinistryCreationPolicy().activeNameConflict());
    this.stored.push(ministry);
    return success();
  }
  async findById(organizationId: OrganizationId, ministryId: MinistryId) {
    const found = this.stored.find(
      (candidate) =>
        candidate.id.equals(ministryId) && candidate.organizationId.equals(organizationId),
    );
    return found === undefined
      ? undefined
      : Ministry.reconstitute({
          id: found.id,
          organizationId: found.organizationId,
          name: found.name,
          status: found.status,
          roles: found.roles,
        });
  }
  async save(ministry: Ministry) {
    const stored = this.stored.find((candidate) => candidate.id.equals(ministry.id));
    if (stored === undefined) throw new Error('test_ministry_repository.aggregate_not_found');
    const newRoles = ministry.roles.filter(
      (role) => !stored.roles.some((candidate) => candidate.id.equals(role.id)),
    );
    const conflict = newRoles.some((role) =>
      stored.roles.some(
        (candidate) =>
          candidate.status === 'active' &&
          candidate.name.toString().toLowerCase() === role.name.toString().toLowerCase(),
      ),
    );
    if (conflict)
      return failure({
        code: MinistryRoleDefinitionErrorCodes.ActiveNameAlreadyExists,
        field: 'name' as const,
      });
    this.stored[this.stored.indexOf(stored)] = ministry;
    return success();
  }
  get ministries(): readonly Ministry[] {
    return Object.freeze([...this.stored]);
  }
}
export class InMemoryMinistryListReader implements MinistryListReader {
  constructor(
    private readonly organizationIds: () => readonly OrganizationId[],
    private readonly ministries: () => readonly Ministry[],
  ) {}
  async list(criteria: Parameters<MinistryListReader['list']>[0]) {
    if (!this.organizationIds().some((id) => id.equals(criteria.organizationId))) return undefined;
    const filtered = this.ministries()
      .filter((item) => item.organizationId.equals(criteria.organizationId))
      .filter((item) => criteria.status === undefined || item.status === criteria.status)
      .filter(
        (item) =>
          criteria.search === undefined ||
          item.name
            .toString()
            .toLocaleLowerCase('pt-BR')
            .includes(criteria.search.toLocaleLowerCase('pt-BR')),
      )
      .sort(
        (left, right) =>
          left.name.toString().toLowerCase().localeCompare(right.name.toString().toLowerCase()) ||
          left.id.toString().localeCompare(right.id.toString()),
      );
    const start = (criteria.page - 1) * criteria.pageSize;
    const items = filtered.slice(start, start + criteria.pageSize);
    return Object.freeze({
      items: Object.freeze(
        items.map((item) =>
          Object.freeze({ id: item.id, name: item.name.toString(), status: item.status }),
        ),
      ),
      pagination: Object.freeze({
        page: criteria.page,
        pageSize: criteria.pageSize,
        totalItems: filtered.length,
        totalPages: filtered.length === 0 ? 0 : Math.ceil(filtered.length / criteria.pageSize),
      }),
    });
  }
}
export class InMemoryMinistryCreationFactsReader implements MinistryCreationFactsReader {
  constructor(
    private readonly organizationIds: () => readonly OrganizationId[],
    private readonly ministries: () => readonly Ministry[],
  ) {}
  async find(organizationId: OrganizationId, name: MinistryName) {
    return Object.freeze({
      organizationExists: this.organizationIds().some((id) => id.equals(organizationId)),
      activeNameExists: this.ministries().some(
        (ministry) =>
          ministry.organizationId.equals(organizationId) &&
          ministry.status === 'active' &&
          ministry.name.toString().toLowerCase() === name.toString().toLowerCase(),
      ),
    });
  }
}
export class InMemoryMinistryMembershipRepository implements MinistryMembershipRepository {
  private readonly stored: MinistryMembership[] = [];
  async add(membership: MinistryMembership) {
    const conflict = this.stored.some(
      (candidate) =>
        candidate.ministryId.equals(membership.ministryId) &&
        candidate.memberId.equals(membership.memberId) &&
        (candidate.status === 'requested' || candidate.status === 'active'),
    );
    if (conflict)
      return failure({
        code: MinistryMembershipRequestPolicyErrorCodes.CurrentMembershipAlreadyExists,
        field: 'memberId' as const,
      });
    this.stored.push(membership);
    return success();
  }
  async findById(
    organizationId: Parameters<MinistryMembershipRepository['findById']>[0],
    ministryId: Parameters<MinistryMembershipRepository['findById']>[1],
    membershipId: Parameters<MinistryMembershipRepository['findById']>[2],
  ) {
    return this.stored.find(
      (candidate) =>
        candidate.id.equals(membershipId) &&
        candidate.organizationId.equals(organizationId) &&
        candidate.ministryId.equals(ministryId),
    );
  }
  async save(_membership: MinistryMembership): Promise<void> {}
  get memberships(): readonly MinistryMembership[] {
    return Object.freeze([...this.stored]);
  }
}
export class InMemoryMinistryMembershipRequestFactsReader implements MinistryMembershipRequestFactsReader {
  constructor(
    private readonly members: () => readonly Member[],
    private readonly ministries: () => readonly Ministry[],
    private readonly memberships: () => readonly MinistryMembership[],
  ) {}
  async findFor(organizationId: OrganizationId, ministryId: MinistryId, memberId: MemberId) {
    return Object.freeze({
      memberIsActive: this.members().some(
        (member) =>
          member.organizationId.equals(organizationId) &&
          member.id.equals(memberId) &&
          member.status === 'active',
      ),
      ministryIsActive: this.ministries().some(
        (ministry) =>
          ministry.organizationId.equals(organizationId) &&
          ministry.id.equals(ministryId) &&
          ministry.status === 'active',
      ),
      currentMembershipExists: this.memberships().some(
        (membership) =>
          membership.organizationId.equals(organizationId) &&
          membership.ministryId.equals(ministryId) &&
          membership.memberId.equals(memberId) &&
          (membership.status === 'requested' || membership.status === 'active'),
      ),
    });
  }
}
export class InMemoryMinistryRoleQualificationFactsReader implements MinistryRoleQualificationFactsReader {
  constructor(private readonly ministries: () => readonly Ministry[]) {}
  async isRoleActive(
    organizationId: OrganizationId,
    ministryId: MinistryId,
    ministryRoleId: Parameters<MinistryRoleQualificationFactsReader['isRoleActive']>[2],
  ) {
    return this.ministries().some(
      (ministry) =>
        ministry.organizationId.equals(organizationId) &&
        ministry.id.equals(ministryId) &&
        ministry.roles.some((role) => role.id.equals(ministryRoleId) && role.status === 'active'),
    );
  }
}
export class InMemoryMinistryTeamRepository implements MinistryTeamRepository {
  private readonly stored: MinistryTeam[] = [];
  async add(team: MinistryTeam) {
    const conflict = this.stored.some(
      (candidate) =>
        candidate.organizationId.equals(team.organizationId) &&
        candidate.ministryId.equals(team.ministryId) &&
        candidate.status === 'active' &&
        candidate.name.toString().toLowerCase() === team.name.toString().toLowerCase(),
    );
    if (conflict)
      return failure({
        code: MinistryTeamCreationPolicyErrorCodes.ActiveNameAlreadyExists,
        field: 'name' as const,
      });
    this.stored.push(team);
    return success();
  }
  get teams(): readonly MinistryTeam[] {
    return Object.freeze([...this.stored]);
  }
}
export class InMemoryMinistryTeamCreationFactsReader implements MinistryTeamCreationFactsReader {
  constructor(
    private readonly ministries: () => readonly Ministry[],
    private readonly teams: () => readonly MinistryTeam[],
  ) {}
  async find(organizationId: OrganizationId, ministryId: MinistryId, name: MinistryTeamName) {
    return Object.freeze({
      ministryIsActive: this.ministries().some(
        (ministry) =>
          ministry.organizationId.equals(organizationId) &&
          ministry.id.equals(ministryId) &&
          ministry.status === 'active',
      ),
      activeNameExists: this.teams().some(
        (team) =>
          team.organizationId.equals(organizationId) &&
          team.ministryId.equals(ministryId) &&
          team.status === 'active' &&
          team.name.toString().toLowerCase() === name.toString().toLowerCase(),
      ),
    });
  }
}
export class InMemoryTeamMembershipRepository implements TeamMembershipRepository {
  private readonly stored: TeamMembership[] = [];
  async add(membership: TeamMembership) {
    const conflict = this.stored.some(
      (candidate) =>
        candidate.organizationId.equals(membership.organizationId) &&
        candidate.ministryId.equals(membership.ministryId) &&
        candidate.ministryTeamId.equals(membership.ministryTeamId) &&
        candidate.ministryMembershipId.equals(membership.ministryMembershipId) &&
        candidate.status === 'active',
    );
    if (conflict)
      return failure({
        code: TeamMembershipAssignmentPolicyErrorCodes.ActiveMembershipAlreadyExists,
        field: 'ministryMembershipId' as const,
      });
    this.stored.push(membership);
    return success();
  }
  get memberships(): readonly TeamMembership[] {
    return Object.freeze([...this.stored]);
  }
}
export class InMemoryTeamMembershipAssignmentFactsReader implements TeamMembershipAssignmentFactsReader {
  constructor(
    private readonly teams: () => readonly MinistryTeam[],
    private readonly ministryMemberships: () => readonly MinistryMembership[],
    private readonly teamMemberships: () => readonly TeamMembership[],
  ) {}
  async find(
    organizationId: OrganizationId,
    ministryId: MinistryId,
    teamId: Parameters<TeamMembershipAssignmentFactsReader['find']>[2],
    membershipId: Parameters<TeamMembershipAssignmentFactsReader['find']>[3],
  ) {
    return Object.freeze({
      teamIsActive: this.teams().some(
        (team) =>
          team.organizationId.equals(organizationId) &&
          team.ministryId.equals(ministryId) &&
          team.id.equals(teamId) &&
          team.status === 'active',
      ),
      ministryMembershipIsActive: this.ministryMemberships().some(
        (membership) =>
          membership.organizationId.equals(organizationId) &&
          membership.ministryId.equals(ministryId) &&
          membership.id.equals(membershipId) &&
          membership.status === 'active',
      ),
      activeTeamMembershipExists: this.teamMemberships().some(
        (membership) =>
          membership.organizationId.equals(organizationId) &&
          membership.ministryId.equals(ministryId) &&
          membership.ministryTeamId.equals(teamId) &&
          membership.ministryMembershipId.equals(membershipId) &&
          membership.status === 'active',
      ),
    });
  }
}
export class InMemoryTeamLeadershipRepository implements TeamLeadershipRepository {
  private readonly stored: TeamLeadership[] = [];
  async add(leadership: TeamLeadership) {
    const conflict = this.stored.some(
      (candidate) =>
        candidate.organizationId.equals(leadership.organizationId) &&
        candidate.ministryId.equals(leadership.ministryId) &&
        candidate.ministryTeamId.equals(leadership.ministryTeamId) &&
        candidate.status === 'active',
    );
    if (conflict)
      return failure({
        code: TeamLeaderAppointmentPolicyErrorCodes.ActiveLeadershipAlreadyExists,
        field: 'ministryTeamId' as const,
      });
    this.stored.push(leadership);
    return success();
  }
  get leaderships(): readonly TeamLeadership[] {
    return Object.freeze([...this.stored]);
  }
}
export class InMemoryTeamLeaderAppointmentFactsReader implements TeamLeaderAppointmentFactsReader {
  constructor(
    private readonly teams: () => readonly MinistryTeam[],
    private readonly teamMemberships: () => readonly TeamMembership[],
    private readonly teamLeaderships: () => readonly TeamLeadership[],
  ) {}
  async find(
    organizationId: OrganizationId,
    ministryId: MinistryId,
    teamId: Parameters<TeamLeaderAppointmentFactsReader['find']>[2],
    membershipId: Parameters<TeamLeaderAppointmentFactsReader['find']>[3],
  ) {
    return Object.freeze({
      teamIsActive: this.teams().some(
        (team) =>
          team.organizationId.equals(organizationId) &&
          team.ministryId.equals(ministryId) &&
          team.id.equals(teamId) &&
          team.status === 'active',
      ),
      teamMembershipIsActive: this.teamMemberships().some(
        (membership) =>
          membership.organizationId.equals(organizationId) &&
          membership.ministryId.equals(ministryId) &&
          membership.ministryTeamId.equals(teamId) &&
          membership.id.equals(membershipId) &&
          membership.status === 'active',
      ),
      activeLeadershipExists: this.teamLeaderships().some(
        (leadership) =>
          leadership.organizationId.equals(organizationId) &&
          leadership.ministryId.equals(ministryId) &&
          leadership.ministryTeamId.equals(teamId) &&
          leadership.status === 'active',
      ),
    });
  }
}
