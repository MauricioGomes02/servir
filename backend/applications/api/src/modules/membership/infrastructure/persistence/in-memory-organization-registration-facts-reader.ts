import type { OrganizationId } from '@/modules/organizations/domain';

import type { OrganizationRegistrationFactsReader } from '../../application';
import type { OrganizationRegistrationFacts } from '../../domain';

export class InMemoryOrganizationRegistrationFactsReader
implements OrganizationRegistrationFactsReader {
  private readonly organizationIds: () => ReadonlyArray<OrganizationId>;

  constructor(
    source: ReadonlyArray<OrganizationId>
      | (() => ReadonlyArray<OrganizationId>),
  ) {
    if (typeof source === 'function') {
      this.organizationIds = source;
      return;
    }

    const snapshot = Object.freeze([...source]);
    this.organizationIds = () => snapshot;
  }

  async findById(
    organizationId: OrganizationId,
  ): Promise<OrganizationRegistrationFacts | undefined> {
    const found = this.organizationIds().find(
      (candidate) => candidate.equals(organizationId),
    );

    return found === undefined
      ? undefined
      : Object.freeze({ organizationId: found });
  }
}
