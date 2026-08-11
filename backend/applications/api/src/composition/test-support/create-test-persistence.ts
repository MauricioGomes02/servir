import {
  InMemoryEventBus,
  InMemoryEventOutbox,
  InMemoryEventOutboxRelay,
} from '@/shared/infrastructure/messaging';
import { DirectUnitOfWork } from '@/shared/infrastructure/unit-of-work';
import { InMemoryLogger } from '@/shared/infrastructure/logging';
import type { ApplicationPersistence } from '../persistence';
import {
  memberDetailsReader,
  memberUnitOfWork,
  organizationRegistrationFacts,
} from '../modules/membership-persistence-module';
import {
  ministryCreationFacts,
  ministryMembershipRequestFacts,
  ministryMembershipUnitOfWork,
  ministryUnitOfWork,
  ministryTeamCreationFacts,
  ministryTeamUnitOfWork,
  teamMembershipAssignmentFacts,
  teamMembershipUnitOfWork,
  teamLeaderAppointmentFacts,
  teamLeadershipUnitOfWork,
} from '../modules/ministries-persistence-module';
import { organizationUnitOfWork } from '../modules/organizations-persistence-module';
import {
  activityCreationFacts,
  activityUnitOfWork,
} from '../modules/activities-persistence-module';
import type { Activity } from '@/modules/activities/domain';
import { ServiceRegistry } from '../services';
import {
  InMemoryMemberDetailsReader,
  InMemoryMemberRepository,
  InMemoryMinistryCreationFactsReader,
  InMemoryMinistryMembershipRepository,
  InMemoryMinistryMembershipRequestFactsReader,
  InMemoryMinistryRoleQualificationFactsReader,
  InMemoryMinistryRepository,
  InMemoryMinistryTeamCreationFactsReader,
  InMemoryMinistryTeamRepository,
  InMemoryTeamMembershipAssignmentFactsReader,
  InMemoryTeamMembershipRepository,
  InMemoryTeamLeaderAppointmentFactsReader,
  InMemoryTeamLeadershipRepository,
  InMemoryOrganizationRegistrationFactsReader,
  InMemoryOrganizationRepository,
} from './persistence-doubles';

export function createTestPersistence(): ApplicationPersistence {
  const organizations = new InMemoryOrganizationRepository();
  const members = new InMemoryMemberRepository();
  const ministries = new InMemoryMinistryRepository();
  const ministryMemberships = new InMemoryMinistryMembershipRepository();
  const ministryTeams = new InMemoryMinistryTeamRepository();
  const teamMemberships = new InMemoryTeamMembershipRepository();
  const teamLeaderships = new InMemoryTeamLeadershipRepository();
  const activities: Activity[] = [];
  const outbox = new InMemoryEventOutbox();
  const eventRelay = new InMemoryEventOutboxRelay(
    outbox,
    new InMemoryEventBus(),
    new InMemoryLogger(),
  );
  const services = new ServiceRegistry();
  services.add(organizationUnitOfWork, new DirectUnitOfWork({ organizations, outbox }));
  services.add(memberUnitOfWork, new DirectUnitOfWork({ members, outbox }));
  services.add(memberDetailsReader, new InMemoryMemberDetailsReader(() => members.members));
  services.add(
    organizationRegistrationFacts,
    new InMemoryOrganizationRegistrationFactsReader(() =>
      organizations.organizations.map(({ id }) => id),
    ),
  );
  services.add(ministryUnitOfWork, new DirectUnitOfWork({ ministries, outbox }));
  services.add(
    ministryCreationFacts,
    new InMemoryMinistryCreationFactsReader(
      () => organizations.organizations.map(({ id }) => id),
      () => ministries.ministries,
    ),
  );
  services.add(
    ministryMembershipUnitOfWork,
    new DirectUnitOfWork({
      ministryMemberships,
      ministryRoleQualificationFacts: new InMemoryMinistryRoleQualificationFactsReader(
        () => ministries.ministries,
      ),
      outbox,
    }),
  );
  services.add(
    ministryMembershipRequestFacts,
    new InMemoryMinistryMembershipRequestFactsReader(
      () => members.members,
      () => ministries.ministries,
      () => ministryMemberships.memberships,
    ),
  );
  services.add(ministryTeamUnitOfWork, new DirectUnitOfWork({ ministryTeams, outbox }));
  services.add(
    ministryTeamCreationFacts,
    new InMemoryMinistryTeamCreationFactsReader(
      () => ministries.ministries,
      () => ministryTeams.teams,
    ),
  );
  services.add(teamMembershipUnitOfWork, new DirectUnitOfWork({ teamMemberships, outbox }));
  services.add(
    teamMembershipAssignmentFacts,
    new InMemoryTeamMembershipAssignmentFactsReader(
      () => ministryTeams.teams,
      () => ministryMemberships.memberships,
      () => teamMemberships.memberships,
    ),
  );
  services.add(teamLeadershipUnitOfWork, new DirectUnitOfWork({ teamLeaderships, outbox }));
  services.add(
    teamLeaderAppointmentFacts,
    new InMemoryTeamLeaderAppointmentFactsReader(
      () => ministryTeams.teams,
      () => teamMemberships.memberships,
      () => teamLeaderships.leaderships,
    ),
  );
  services.add(
    activityUnitOfWork,
    new DirectUnitOfWork({
      activities: {
        async add(activity: Activity) {
          activities.push(activity);
          return { success: true as const, value: undefined };
        },
      },
      outbox,
    }),
  );
  services.add(activityCreationFacts, {
    async find(organizationId, name, ministryIds) {
      return Object.freeze({
        organizationExists: organizations.organizations.some((item) =>
          item.id.equals(organizationId),
        ),
        activeNameExists: activities.some(
          (item) =>
            item.organizationId.equals(organizationId) &&
            item.status === 'active' &&
            item.name.toString().toLowerCase() === name.toString().toLowerCase(),
        ),
        activeMinistryIds: new Set(
          ministries.ministries
            .filter(
              (item) =>
                item.organizationId.equals(organizationId) &&
                item.status === 'active' &&
                ministryIds.some((id) => id.equals(item.id)),
            )
            .map((item) => item.id.toString()),
        ),
      });
    },
  });

  return {
    services,
    eventRelay,
    async close() {},
  };
}
