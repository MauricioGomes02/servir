import type { OrganizationId } from '@/modules/organizations/domain';
import type { MinistryRepository } from '../../application';
import { Ministry, MinistryCreationPolicy, MinistryRoleDefinitionErrorCodes, type MinistryId } from '../../domain';
import { failure, success } from '@/shared/core/result';

export class InMemoryMinistryRepository implements MinistryRepository {
  private readonly storedMinistries: Ministry[] = [];

  async add(ministry: Ministry) {
    const conflict = this.storedMinistries.some((candidate) =>
      candidate.organizationId.equals(ministry.organizationId)
      && candidate.status === 'active'
      && candidate.name.toString().toLowerCase()
        === ministry.name.toString().toLowerCase());
    if (conflict) return failure(new MinistryCreationPolicy().activeNameConflict());
    this.storedMinistries.push(ministry);
    return success();
  }

  async findById(organizationId: OrganizationId, ministryId: MinistryId) {
    const found = this.storedMinistries.find((candidate) => candidate.id.equals(ministryId)
      && candidate.organizationId.equals(organizationId));
    return found === undefined ? undefined : Ministry.reconstitute({
      id: found.id, organizationId: found.organizationId, name: found.name,
      status: found.status, roles: found.roles,
    });
  }

  async save(ministry: Ministry) {
    const stored = this.storedMinistries.find((candidate) => candidate.id.equals(ministry.id));
    if (stored === undefined) throw new Error('in_memory_ministry_repository.aggregate_not_found');
    const newRoles = ministry.roles.filter((role) => !stored.roles.some((candidate) => candidate.id.equals(role.id)));
    const conflict = newRoles.some((role) => stored.roles.some((candidate) => candidate.status === 'active'
      && candidate.name.toString().toLowerCase() === role.name.toString().toLowerCase()));
    if (conflict) return failure({ code: MinistryRoleDefinitionErrorCodes.ActiveNameAlreadyExists, field: 'name' });
    this.storedMinistries[this.storedMinistries.indexOf(stored)] = ministry;
    return success();
  }

  get ministries(): ReadonlyArray<Ministry> { return Object.freeze([...this.storedMinistries]); }
}
