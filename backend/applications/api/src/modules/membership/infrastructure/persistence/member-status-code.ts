import type { MemberStatus } from '../../domain';
import { UnsupportedMemberStatusCodeError } from './unsupported-member-status-code-error';

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

export function fromMemberStatusCode(statusCode: unknown): MemberStatus {
  switch (statusCode) {
    case MemberStatusCodes.Active:
      return 'active';
    case MemberStatusCodes.Inactive:
      return 'inactive';
    default:
      throw new UnsupportedMemberStatusCodeError(statusCode);
  }
}
