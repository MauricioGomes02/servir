import {
  createMemberDetails,
  type MemberDetails,
  type MemberDetailsReader,
  type MemberRepository,
  type OrganizationRegistrationFactsReader,
} from '@/modules/membership/application';
import type { Member, MemberId, OrganizationRegistrationFacts } from '@/modules/membership/domain';
import type { OrganizationRepository } from '@/modules/organizations/application';
import type { Organization, OrganizationId } from '@/modules/organizations/domain';
import type {
  MinistryCreationFactsReader,
  MinistryMembershipRepository,
  MinistryMembershipRequestFactsReader,
  MinistryRoleQualificationFactsReader,
  MinistryRepository,
} from '@/modules/ministries/application';
import {
  Ministry,
  MinistryCreationPolicy,
  MinistryMembershipRequestPolicyErrorCodes,
  MinistryRoleDefinitionErrorCodes,
  type MinistryId,
  type MinistryMembership,
  type MinistryName,
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
