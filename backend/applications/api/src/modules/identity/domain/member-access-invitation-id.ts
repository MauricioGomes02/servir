import { failure, success, type Result } from '@/shared/core/result';
import { EntityId, validateEntityId } from '@/shared/domain/entity';

import {
  MemberAccessInvitationIdErrorCodes,
  type MemberAccessInvitationIdError,
} from './member-access-invitation-id-error';

export class MemberAccessInvitationId extends EntityId<'MemberAccessInvitationId'> {
  private constructor(value: string) {
    super(value);
    Object.freeze(this);
  }

  static create(input: unknown): Result<MemberAccessInvitationId, MemberAccessInvitationIdError> {
    const validated = validateEntityId(
      input,
      'memberAccessInvitationId',
      MemberAccessInvitationIdErrorCodes,
    );
    return validated.success
      ? success(new MemberAccessInvitationId(validated.value))
      : failure(validated.error);
  }
}
