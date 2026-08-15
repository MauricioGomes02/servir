export type MemberStatus = 'active' | 'inactive';

export interface MemberSummary {
  readonly id: string;
  readonly name: string;
  readonly status: MemberStatus;
}

export interface MemberDetails extends MemberSummary {
  readonly organizationId: string;
}

export interface MemberPage {
  readonly items: readonly MemberSummary[];
  readonly pagination: Readonly<{
    readonly page: number;
    readonly pageSize: number;
    readonly totalItems: number;
    readonly totalPages: number;
  }>;
}

export interface MemberListFilters {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly status?: MemberStatus;
}
