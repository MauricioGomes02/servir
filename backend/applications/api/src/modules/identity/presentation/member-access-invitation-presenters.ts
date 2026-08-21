import type {
  AcceptMemberAccessInvitationError,
  AcceptMemberAccessInvitationOutput,
  InviteMemberToAccessError,
  InviteMemberToAccessOutput,
} from '../application';
import type { ExecutionContext } from '@/shared/application/context';
import type { Result } from '@/shared/core/result';
import {
  presentErrorGroup,
  type MessageTranslator,
  type PresentedError,
  type SupportedLocale,
} from '@/shared/presentation';

export type MemberAccessInvitationFailureView = Readonly<{
  kind: 'failure';
  error: PresentedError;
  errors: readonly PresentedError[];
}>;

export type InviteMemberToAccessView =
  | Readonly<{
      kind: 'success';
      resource: Readonly<{ expiresAt: string; id: string; token: string }>;
    }>
  | MemberAccessInvitationFailureView;

export class InviteMemberToAccessPresenter {
  constructor(private readonly translator: MessageTranslator) {}

  present(
    result: Result<InviteMemberToAccessOutput, InviteMemberToAccessError>,
    context: ExecutionContext,
    locale: SupportedLocale,
  ): InviteMemberToAccessView {
    if (!result.success) {
      return Object.freeze({
        kind: 'failure',
        ...presentErrorGroup(result.error, context, locale, this.translator),
      });
    }
    return Object.freeze({
      kind: 'success',
      resource: Object.freeze({
        expiresAt: result.value.expiresAt.toISOString(),
        id: result.value.invitationId.toString(),
        token: result.value.rawToken,
      }),
    });
  }
}

export type AcceptMemberAccessInvitationView =
  | Readonly<{
      kind: 'success';
      resource: Readonly<{ accessId: string; memberId: string; organizationId: string }>;
    }>
  | MemberAccessInvitationFailureView;

export class AcceptMemberAccessInvitationPresenter {
  constructor(private readonly translator: MessageTranslator) {}

  present(
    result: Result<AcceptMemberAccessInvitationOutput, AcceptMemberAccessInvitationError>,
    context: ExecutionContext,
    locale: SupportedLocale,
  ): AcceptMemberAccessInvitationView {
    if (!result.success) {
      return Object.freeze({
        kind: 'failure',
        ...presentErrorGroup(result.error, context, locale, this.translator),
      });
    }
    return Object.freeze({
      kind: 'success',
      resource: Object.freeze({
        accessId: result.value.accessId.toString(),
        memberId: result.value.memberId.toString(),
        organizationId: result.value.organizationId.toString(),
      }),
    });
  }
}
