import type { MinistryId } from '@/modules/ministries/domain';
import type { OrganizationId } from '@/modules/organizations/domain';
import type { EventOutbox } from '@/shared/application/messaging';
import type { Result } from '@/shared/core/result';

import type {
  Activity,
  ActivityCreationError,
  ActivityCreationFacts,
  ActivityName,
} from '../domain';

export interface ActivityRepository {
  add(activity: Activity): Promise<Result<void, ActivityCreationError>>;
}

export interface ActivityCreationFactsReader {
  find(
    organizationId: OrganizationId,
    name: ActivityName,
    ministryIds: readonly MinistryId[],
  ): Promise<ActivityCreationFacts>;
}

export interface ActivityWriteScope {
  readonly activities: ActivityRepository;
  readonly outbox: EventOutbox;
}
