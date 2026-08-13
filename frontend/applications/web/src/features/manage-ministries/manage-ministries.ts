import type {
  MinistryGateway,
  MinistryListFilters,
  MinistryPage,
  MinistrySummary,
} from './ministry';

export class ManageMinistries {
  constructor(private readonly gateway: MinistryGateway) {}

  list(
    organizationId: string,
    filters: MinistryListFilters,
    signal?: AbortSignal,
  ): Promise<MinistryPage> {
    return this.gateway.list(organizationId, filters, signal);
  }

  create(organizationId: string, name: string, signal?: AbortSignal): Promise<MinistrySummary> {
    return this.gateway.create(organizationId, name, signal);
  }
}
