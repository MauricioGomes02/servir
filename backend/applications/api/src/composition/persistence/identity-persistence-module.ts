import type {
  MemberAccessInvitationWriteScope,
  OrganizationAccessReader,
  UserProvisioner,
} from '@/modules/identity/application';
import {
  PostgresMemberAccessInvitationAcceptanceLock,
  PostgresMemberAccessInvitationRepository,
  PostgresMemberAccessLinkingFactsReader,
  PostgresOrganizationAccessRepository,
  PostgresOrganizationAccessReader,
  PostgresUserProvisioner,
} from '@/modules/identity/infrastructure';
import type { UnitOfWork } from '@/shared/application/unit-of-work';

import type { PostgresPersistenceBuilder } from './postgres-persistence-builder';
import { defineService } from '../services';

export const userProvisioner = defineService<UserProvisioner>('identity.user-provisioner');
export const organizationAccessReader = defineService<OrganizationAccessReader>(
  'identity.organization-access-reader',
);
export const memberAccessInvitationUnitOfWork = defineService<
  UnitOfWork<MemberAccessInvitationWriteScope>
>('identity.member-access-invitation-unit-of-work');

export function registerIdentityPersistence(builder: PostgresPersistenceBuilder): void {
  builder.addValue(userProvisioner, (pool) => new PostgresUserProvisioner(pool));
  builder.addValue(organizationAccessReader, (pool) => new PostgresOrganizationAccessReader(pool));
  builder.addWriteScope(memberAccessInvitationUnitOfWork, (client) => ({
    acceptanceLock: new PostgresMemberAccessInvitationAcceptanceLock(client),
    invitations: new PostgresMemberAccessInvitationRepository(client),
    linkingFacts: new PostgresMemberAccessLinkingFactsReader(client),
    organizationAccesses: new PostgresOrganizationAccessRepository(client),
  }));
}
