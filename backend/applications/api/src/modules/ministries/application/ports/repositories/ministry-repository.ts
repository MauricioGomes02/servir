import type { OrganizationId } from '@/modules/organizations/domain';
import type { Ministry, MinistryId } from '../../../domain';

export interface MinistryRepository {
  add(ministry: Ministry): Promise<void>;
  findById(organizationId: OrganizationId, ministryId: MinistryId): Promise<Ministry | undefined>;
  save(ministry: Ministry): Promise<void>;
}
