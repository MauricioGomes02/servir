import type {
  MemberDetailsReader,
  MemberWriteScope,
  OrganizationRegistrationFactsReader,
} from '@/modules/membership/application';
import type {
  MinistryCreationFactsReader,
  MinistryMembershipRequestFactsReader,
  MinistryMembershipWriteScope,
  MinistryWriteScope,
} from '@/modules/ministries/application';
import type { OrganizationWriteScope } from '@/modules/organizations/application';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import type { InMemoryEventOutboxRelay } from '@/shared/infrastructure/messaging';

export interface ApplicationPersistence {
  readonly organizationUnitOfWork: UnitOfWork<OrganizationWriteScope>;
  readonly memberUnitOfWork: UnitOfWork<MemberWriteScope>;
  readonly memberDetailsReader: MemberDetailsReader;
  readonly organizationRegistrationFacts: OrganizationRegistrationFactsReader;
  readonly ministryUnitOfWork: UnitOfWork<MinistryWriteScope>;
  readonly ministryCreationFacts: MinistryCreationFactsReader;
  readonly ministryMembershipUnitOfWork: UnitOfWork<MinistryMembershipWriteScope>;
  readonly ministryMembershipRequestFacts: MinistryMembershipRequestFactsReader;
  readonly eventRelay?: InMemoryEventOutboxRelay;
  close(): Promise<void>;
}
