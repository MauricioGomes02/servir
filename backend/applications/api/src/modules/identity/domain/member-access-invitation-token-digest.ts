import { failure, success, type Result } from '@/shared/core/result';
import { ValueObject } from '@/shared/domain/value-object';

import {
  MemberAccessInvitationTokenDigestErrorCodes,
  type MemberAccessInvitationTokenDigestError,
} from './member-access-invitation-token-digest-error';

interface TokenDigestProps {
  readonly value: string;
}

export class MemberAccessInvitationTokenDigest extends ValueObject<
  TokenDigestProps,
  'MemberAccessInvitationTokenDigest'
> {
  private constructor(value: string) {
    super({ value });
    Object.freeze(this);
  }

  static create(
    input: unknown,
  ): Result<MemberAccessInvitationTokenDigest, MemberAccessInvitationTokenDigestError> {
    if (typeof input !== 'string') {
      return failure({
        code: MemberAccessInvitationTokenDigestErrorCodes.InvalidType,
        field: 'tokenDigest',
      });
    }
    if (!/^[a-f0-9]{64}$/.test(input)) {
      return failure({
        code: MemberAccessInvitationTokenDigestErrorCodes.InvalidFormat,
        field: 'tokenDigest',
      });
    }
    return success(new MemberAccessInvitationTokenDigest(input));
  }

  toString(): string {
    return this.props.value;
  }
}
