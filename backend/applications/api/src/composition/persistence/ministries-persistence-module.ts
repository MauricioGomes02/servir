import type {
  MinistryMembershipWriteScope,
  MinistryWriteScope,
  MinistryTeamCreationFactsReader,
  MinistryTeamWriteScope,
  TeamMembershipAssignmentFactsReader,
  TeamMembershipWriteScope,
  TeamLeaderAppointmentFactsReader,
  TeamLeadershipWriteScope,
  MinistryListReader,
  MinistryDetailsReader,
} from '@/modules/ministries/application';
import type {
  MinistryCreated,
  MinistryMembershipApproved,
  MinistryMembershipRequested,
  MinistryRoleDefined,
  MemberQualifiedForMinistryRole,
  MinistryTeamCreated,
  MemberAssignedToTeam,
  TeamLeaderAppointed,
} from '@/modules/ministries/domain';
import {
  mapMinistryCreatedIntegrationEvent,
  mapMinistryMembershipApprovedIntegrationEvent,
  mapMinistryMembershipRequestedIntegrationEvent,
  mapMinistryRoleDefinedIntegrationEvent,
  mapMemberQualifiedForMinistryRoleIntegrationEvent,
  PostgresMinistryCreationFactsReader,
  PostgresMinistryMembershipRepository,
  PostgresMinistryMembershipRequestFactsReader,
  PostgresMinistryMembershipWriteLock,
  PostgresMinistryRoleQualificationFactsReader,
  PostgresMinistryRepository,
  PostgresMinistryWriteLock,
  PostgresMinistryTeamCreationFactsReader,
  PostgresMinistryTeamRepository,
  mapMinistryTeamCreatedIntegrationEvent,
  mapMemberAssignedToTeamIntegrationEvent,
  PostgresTeamMembershipAssignmentFactsReader,
  PostgresTeamMembershipRepository,
  mapTeamLeaderAppointedIntegrationEvent,
  PostgresTeamLeaderAppointmentFactsReader,
  PostgresTeamLeadershipRepository,
  PostgresMinistryListReader,
  PostgresMinistryDetailsReader,
} from '@/modules/ministries/infrastructure';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import type { PostgresPersistenceBuilder } from './postgres-persistence-builder';
import { defineService } from '../services';

export const ministryUnitOfWork =
  defineService<UnitOfWork<MinistryWriteScope>>('ministries.unit-of-work');
export const ministryMembershipUnitOfWork = defineService<UnitOfWork<MinistryMembershipWriteScope>>(
  'ministries.membership-unit-of-work',
);
export const ministryTeamUnitOfWork = defineService<UnitOfWork<MinistryTeamWriteScope>>(
  'ministries.team-unit-of-work',
);
export const ministryTeamCreationFacts = defineService<MinistryTeamCreationFactsReader>(
  'ministries.team-creation-facts',
);
export const teamMembershipUnitOfWork = defineService<UnitOfWork<TeamMembershipWriteScope>>(
  'ministries.team-membership-unit-of-work',
);
export const teamMembershipAssignmentFacts = defineService<TeamMembershipAssignmentFactsReader>(
  'ministries.team-membership-assignment-facts',
);
export const teamLeadershipUnitOfWork = defineService<UnitOfWork<TeamLeadershipWriteScope>>(
  'ministries.team-leadership-unit-of-work',
);
export const teamLeaderAppointmentFacts = defineService<TeamLeaderAppointmentFactsReader>(
  'ministries.team-leader-appointment-facts',
);
export const ministryListReader = defineService<MinistryListReader>('ministries.list-reader');
export const ministryDetailsReader = defineService<MinistryDetailsReader>(
  'ministries.details-reader',
);
export function registerMinistriesPersistence(builder: PostgresPersistenceBuilder): void {
  builder.integrationEvents.register<MinistryCreated>(
    'ministry.created',
    mapMinistryCreatedIntegrationEvent,
  );
  builder.integrationEvents.register<MinistryRoleDefined>(
    'ministry.role_defined',
    mapMinistryRoleDefinedIntegrationEvent,
  );
  builder.integrationEvents.register<MinistryMembershipRequested>(
    'ministry_membership.requested',
    mapMinistryMembershipRequestedIntegrationEvent,
  );
  builder.integrationEvents.register<MinistryMembershipApproved>(
    'ministry_membership.approved',
    mapMinistryMembershipApprovedIntegrationEvent,
  );
  builder.integrationEvents.register<MemberQualifiedForMinistryRole>(
    'member.qualified_for_ministry_role',
    mapMemberQualifiedForMinistryRoleIntegrationEvent,
  );
  builder.integrationEvents.register<MinistryTeamCreated>(
    'ministry_team.created',
    mapMinistryTeamCreatedIntegrationEvent,
  );
  builder.integrationEvents.register<MemberAssignedToTeam>(
    'member.assigned_to_team',
    mapMemberAssignedToTeamIntegrationEvent,
  );
  builder.integrationEvents.register<TeamLeaderAppointed>(
    'team_leader.appointed',
    mapTeamLeaderAppointedIntegrationEvent,
  );
  builder.addWriteScope(ministryUnitOfWork, (client) => ({
    creationFacts: new PostgresMinistryCreationFactsReader(client),
    ministries: new PostgresMinistryRepository(client),
    writeLock: new PostgresMinistryWriteLock(client),
  }));
  builder.addWriteScope(ministryMembershipUnitOfWork, (client) => ({
    membershipRequestFacts: new PostgresMinistryMembershipRequestFactsReader(client),
    ministryMemberships: new PostgresMinistryMembershipRepository(client),
    ministryRoleQualificationFacts: new PostgresMinistryRoleQualificationFactsReader(client),
    writeLock: new PostgresMinistryMembershipWriteLock(client),
  }));
  builder.addWriteScope(ministryTeamUnitOfWork, (client) => ({
    ministryTeams: new PostgresMinistryTeamRepository(client),
  }));
  builder.addWriteScope(teamMembershipUnitOfWork, (client) => ({
    teamMemberships: new PostgresTeamMembershipRepository(client),
  }));
  builder.addWriteScope(teamLeadershipUnitOfWork, (client) => ({
    teamLeaderships: new PostgresTeamLeadershipRepository(client),
  }));
  builder.addValue(
    ministryTeamCreationFacts,
    (pool) => new PostgresMinistryTeamCreationFactsReader(pool),
  );
  builder.addValue(
    teamMembershipAssignmentFacts,
    (pool) => new PostgresTeamMembershipAssignmentFactsReader(pool),
  );
  builder.addValue(
    teamLeaderAppointmentFacts,
    (pool) => new PostgresTeamLeaderAppointmentFactsReader(pool),
  );
  builder.addValue(ministryListReader, (pool) => new PostgresMinistryListReader(pool));
  builder.addValue(ministryDetailsReader, (pool) => new PostgresMinistryDetailsReader(pool));
}
