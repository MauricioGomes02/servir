import type { MinistryStatus } from '../../domain';

export const MinistryStatusCodes = { Active: 1, Inactive: 2 } as const;

export function toMinistryStatusCode(status: MinistryStatus): number {
  switch (status) {
    case 'active': return MinistryStatusCodes.Active;
    case 'inactive': return MinistryStatusCodes.Inactive;
    default: { const unsupported: never = status; return unsupported; }
  }
}

export function fromMinistryStatusCode(code: unknown): MinistryStatus {
  if (code === MinistryStatusCodes.Active) return 'active';
  if (code === MinistryStatusCodes.Inactive) return 'inactive';
  throw new Error('unsupported_ministry_status_code');
}
