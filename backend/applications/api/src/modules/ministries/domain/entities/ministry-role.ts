import { Entity } from '@/shared/domain/entity';
import type { MinistryRoleName } from '../value-objects';
import type { MinistryRoleId } from './ministry-role-id';

export type MinistryRoleStatus = 'active' | 'inactive';
interface Props { readonly name: MinistryRoleName; readonly status: MinistryRoleStatus }
export class MinistryRole extends Entity<MinistryRoleId, Props> {
  private constructor(id: MinistryRoleId, props: Props) { super(id, props); }
  static create(id: MinistryRoleId, name: MinistryRoleName): MinistryRole {
    return new MinistryRole(id, { name, status: 'active' });
  }
  static reconstitute(id: MinistryRoleId, name: MinistryRoleName, status: MinistryRoleStatus): MinistryRole {
    return new MinistryRole(id, { name, status });
  }
  get name(): MinistryRoleName { return this.props.name; }
  get status(): MinistryRoleStatus { return this.props.status; }
}
