import type { MemberStatus } from '../../domain';

export const MemberStatusCodes = {
  Active: 1,
  Inactive: 2,
} as const;

export function toMemberStatusCode(status: MemberStatus): number {
  switch (status) {
    case 'active':
      return MemberStatusCodes.Active;
    case 'inactive':
      return MemberStatusCodes.Inactive;
    default: {
      const unsupportedStatus: never = status;
      return unsupportedStatus;
    }
  }
}
