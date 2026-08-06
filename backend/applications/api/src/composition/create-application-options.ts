import type {
  MemberDetailsReader,
  MemberWriteScope,
  OrganizationRegistrationFactsReader,
} from '@/modules/membership/application';
import type { OrganizationWriteScope } from '@/modules/organizations/application';
import type {
  MinistryCreationFactsReader,
  MinistryWriteScope,
} from '@/modules/ministries/application';
import type { Logger } from '@/shared/application/logging';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import type { UuidV7Source } from '@/shared/infrastructure/id-generator';

export interface CreateApplicationOptions {
  readonly logger?: Logger;
  readonly monotonicNow?: () => number;
  readonly memberUnitOfWork?: UnitOfWork<MemberWriteScope>;
  readonly memberDetailsReader?: MemberDetailsReader;
  readonly organizationRegistrationFacts?: OrganizationRegistrationFactsReader;
  readonly organizationUnitOfWork?: UnitOfWork<OrganizationWriteScope>;
  readonly ministryUnitOfWork?: UnitOfWork<MinistryWriteScope>;
  readonly ministryCreationFacts?: MinistryCreationFactsReader;
  readonly uuidSource?: UuidV7Source;
}
