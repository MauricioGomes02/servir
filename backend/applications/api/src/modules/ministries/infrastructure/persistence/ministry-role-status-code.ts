import type { MinistryRoleStatus } from '../../domain';
export const MinistryRoleStatusCodes = { Active: 1, Inactive: 2 } as const;
export function toMinistryRoleStatusCode(status: MinistryRoleStatus): number {
  if (status === 'active') return MinistryRoleStatusCodes.Active;
  if (status === 'inactive') return MinistryRoleStatusCodes.Inactive;
  const unsupported: never = status; return unsupported;
}
export function fromMinistryRoleStatusCode(code: unknown): MinistryRoleStatus {
  if (code === MinistryRoleStatusCodes.Active) return 'active';
  if (code === MinistryRoleStatusCodes.Inactive) return 'inactive';
  throw new Error('unsupported_ministry_role_status_code');
}
