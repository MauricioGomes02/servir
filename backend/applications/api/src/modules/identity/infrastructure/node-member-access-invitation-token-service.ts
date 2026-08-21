import { createHash, randomBytes } from 'node:crypto';
import type {
  MemberAccessInvitationTokenDigester,
  MemberAccessInvitationTokenGenerator,
} from '../application';
import { MemberAccessInvitationTokenDigest } from '../domain';

export const MemberAccessInvitationTokenServiceErrorCodes = {
  DigestFailed: 'identity.member_access_invitation_token_service.digest_failed',
  GenerationFailed: 'identity.member_access_invitation_token_service.generation_failed',
} as const;

export type MemberAccessInvitationTokenServiceErrorCode =
  (typeof MemberAccessInvitationTokenServiceErrorCodes)[keyof typeof MemberAccessInvitationTokenServiceErrorCodes];

export class MemberAccessInvitationTokenServiceError extends Error {
  constructor(
    readonly code: MemberAccessInvitationTokenServiceErrorCode,
    override readonly cause: unknown,
  ) {
    super(code, { cause });
    this.name = 'MemberAccessInvitationTokenServiceError';
  }
}

export class NodeMemberAccessInvitationTokenService
  implements MemberAccessInvitationTokenGenerator, MemberAccessInvitationTokenDigester
{
  generate(): string {
    try {
      return randomBytes(32).toString('base64url');
    } catch (cause) {
      throw new MemberAccessInvitationTokenServiceError(
        MemberAccessInvitationTokenServiceErrorCodes.GenerationFailed,
        cause,
      );
    }
  }

  digest(rawToken: string): MemberAccessInvitationTokenDigest {
    try {
      const digest = MemberAccessInvitationTokenDigest.create(
        createHash('sha256').update(rawToken, 'utf8').digest('hex'),
      );
      if (!digest.success) {
        throw new MemberAccessInvitationTokenServiceError(
          MemberAccessInvitationTokenServiceErrorCodes.DigestFailed,
          digest.error,
        );
      }
      return digest.value;
    } catch (cause) {
      if (cause instanceof MemberAccessInvitationTokenServiceError) throw cause;
      throw new MemberAccessInvitationTokenServiceError(
        MemberAccessInvitationTokenServiceErrorCodes.DigestFailed,
        cause,
      );
    }
  }
}
