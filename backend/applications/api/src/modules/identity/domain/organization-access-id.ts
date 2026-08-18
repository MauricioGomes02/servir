import { failure, success, type Result } from '@/shared/core/result';
import { isCanonicalUuid } from '@/shared/core/uuid';
import { EntityId } from '@/shared/domain/entity';

export interface OrganizationAccessIdError {
  readonly code: 'identity.organization_access_id.invalid';
  readonly field: 'organizationAccessId';
}

export class OrganizationAccessId extends EntityId<'OrganizationAccessId'> {
  private constructor(value: string) {
    super(value);
    Object.freeze(this);
  }

  static create(input: unknown): Result<OrganizationAccessId, OrganizationAccessIdError> {
    if (typeof input !== 'string' || !isCanonicalUuid(input.trim())) {
      return failure({
        code: 'identity.organization_access_id.invalid',
        field: 'organizationAccessId',
      });
    }
    return success(new OrganizationAccessId(input.trim().toLowerCase()));
  }
}
