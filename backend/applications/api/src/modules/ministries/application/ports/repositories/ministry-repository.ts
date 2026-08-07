import type { Result } from '@/shared/core/result';
import type { OrganizationId } from '@/modules/organizations/domain';
import type {
  Ministry,
  MinistryActiveNameConflictError,
  MinistryId,
  MinistryRoleDefinitionError,
} from '../../../domain';

export interface MinistryRepository {
  add(ministry: Ministry): Promise<Result<void, MinistryActiveNameConflictError>>;
  findById(organizationId: OrganizationId, ministryId: MinistryId): Promise<Ministry | undefined>;
  save(ministry: Ministry): Promise<Result<void, MinistryRoleDefinitionError>>;
}
