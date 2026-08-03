import type { Organization } from '../../../domain';

export interface OrganizationRepository {
  save(organization: Organization): Promise<void>;
}
