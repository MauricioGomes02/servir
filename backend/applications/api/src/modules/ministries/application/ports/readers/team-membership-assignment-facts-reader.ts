import type { OrganizationId } from '@/modules/organizations/domain';
import type {
  MinistryId,
  MinistryMembershipId,
  MinistryTeamId,
  TeamMembershipAssignmentFacts,
} from '../../../domain';
export interface TeamMembershipAssignmentFactsReader {
  find(
    organizationId: OrganizationId,
    ministryId: MinistryId,
    ministryTeamId: MinistryTeamId,
    ministryMembershipId: MinistryMembershipId,
  ): Promise<TeamMembershipAssignmentFacts>;
}
