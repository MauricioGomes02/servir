export type ActivityStatus = 'active' | 'inactive';

export interface ActivitySummary {
  readonly id: string;
  readonly name: string;
  readonly status: ActivityStatus;
  readonly ministryCount: number;
}

export interface ActivityMinistry {
  readonly id: string;
  readonly name: string;
}

export interface ActivityDetails {
  readonly id: string;
  readonly name: string;
  readonly status: ActivityStatus;
  readonly ministries: readonly ActivityMinistry[];
}

export interface ActivityPage {
  readonly items: readonly ActivitySummary[];
  readonly pagination: Readonly<{
    readonly page: number;
    readonly pageSize: number;
    readonly totalItems: number;
    readonly totalPages: number;
  }>;
}

export interface ActivityListFilters {
  readonly search?: string;
  readonly status?: ActivityStatus;
  readonly page?: number;
  readonly pageSize?: number;
}
