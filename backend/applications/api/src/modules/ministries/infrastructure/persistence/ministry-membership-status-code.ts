import type { MinistryMembershipStatus } from '../../domain';
const codes = { requested: 1, active: 2, rejected: 3, suspended: 4, ended: 5 } as const;
export function toMinistryMembershipStatusCode(status: MinistryMembershipStatus): number {
  return codes[status];
}
export function fromMinistryMembershipStatusCode(code: unknown): MinistryMembershipStatus {
  const entry = Object.entries(codes).find(([, value]) => value === code);
  if (entry === undefined) throw new Error('unsupported_ministry_membership_status_code');
  return entry[0] as MinistryMembershipStatus;
}
