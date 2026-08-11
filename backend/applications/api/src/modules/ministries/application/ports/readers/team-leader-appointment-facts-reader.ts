import type { OrganizationId } from '@/modules/organizations/domain';
import type {
  MinistryId,
  MinistryTeamId,
  TeamLeaderAppointmentFacts,
  TeamMembershipId,
} from '../../../domain';

export interface TeamLeaderAppointmentFactsReader {
  find(
    organizationId: OrganizationId,
    ministryId: MinistryId,
    ministryTeamId: MinistryTeamId,
    teamMembershipId: TeamMembershipId,
  ): Promise<TeamLeaderAppointmentFacts>;
}
