export type MinistryStatus = 'active' | 'inactive';

export interface MinistrySummary {
  readonly id: string;
  readonly name: string;
  readonly status: MinistryStatus;
}

export interface MinistryPage {
  readonly items: readonly MinistrySummary[];
  readonly pagination: Readonly<{
    readonly page: number;
    readonly pageSize: number;
    readonly totalItems: number;
    readonly totalPages: number;
  }>;
}

export interface MinistryListFilters {
  readonly search?: string;
  readonly status?: MinistryStatus;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface MinistryGateway {
  list(
    organizationId: string,
    filters: MinistryListFilters,
    signal?: AbortSignal,
  ): Promise<MinistryPage>;
  create(organizationId: string, name: string, signal?: AbortSignal): Promise<MinistrySummary>;
}
