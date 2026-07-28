import {
  failure,
  success,
  type Result,
} from '@/shared/core/result';
import { EntityId } from '@/shared/domain/entity';

import {
  OrganizationIdErrorCodes,
  type OrganizationIdError,
} from './organization-id-error';

const MAX_ORGANIZATION_ID_LENGTH = 128;

export class OrganizationId extends EntityId<'OrganizationId'> {
  private constructor(value: string) {
    super(value);
    Object.freeze(this);
  }

  static create(
    input: unknown,
  ): Result<OrganizationId, OrganizationIdError> {
    if (typeof input !== 'string') {
      return failure({
        code: OrganizationIdErrorCodes.InvalidType,
        field: 'organizationId',
      });
    }

    const value = input.trim();

    if (value.length === 0) {
      return failure({
        code: OrganizationIdErrorCodes.Empty,
        field: 'organizationId',
      });
    }

    if (value.length > MAX_ORGANIZATION_ID_LENGTH) {
      return failure({
        code: OrganizationIdErrorCodes.TooLong,
        field: 'organizationId',
        params: {
          maxLength: MAX_ORGANIZATION_ID_LENGTH,
          actualLength: value.length,
        },
      });
    }

    return success(new OrganizationId(value));
  }
}
