import { Entity } from '@/shared/domain/entity';
import type { Instant } from '@/shared/domain/instant';
import type { MinistryRoleId } from './ministry-role-id';
import type { MinistryRoleQualificationId } from './ministry-role-qualification-id';

export type MinistryRoleQualificationStatus = 'active' | 'revoked';

interface Props {
  readonly ministryRoleId: MinistryRoleId;
  readonly status: MinistryRoleQualificationStatus;
  readonly qualifiedAt: Instant;
}

export class MinistryRoleQualification extends Entity<MinistryRoleQualificationId, Props> {
  private constructor(id: MinistryRoleQualificationId, props: Props) {
    super(id, props);
  }
  static create(
    id: MinistryRoleQualificationId,
    ministryRoleId: MinistryRoleId,
    qualifiedAt: Instant,
  ) {
    return new MinistryRoleQualification(id, { ministryRoleId, status: 'active', qualifiedAt });
  }
  static reconstitute(
    id: MinistryRoleQualificationId,
    ministryRoleId: MinistryRoleId,
    status: MinistryRoleQualificationStatus,
    qualifiedAt: Instant,
  ) {
    return new MinistryRoleQualification(id, { ministryRoleId, status, qualifiedAt });
  }
  get ministryRoleId() {
    return this.props.ministryRoleId;
  }
  get status() {
    return this.props.status;
  }
  get qualifiedAt() {
    return this.props.qualifiedAt;
  }
}
