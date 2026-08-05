import type { RegisterMemberOutput } from '@/modules/membership/application';
import type {
  MemberNameError,
  MemberRegistrationPolicyError,
} from '@/modules/membership/domain';
import type { OrganizationIdError } from '@/modules/organizations/domain';
import type { ExecutionContext } from '@/shared/application/context';
import type { Result } from '@/shared/core/result';
import {
  presentError,
  type MessageTranslator,
  type PresentedError,
  type SupportedLocale,
} from '@/shared/presentation';

type RegisterMemberError = OrganizationIdError
  | MemberNameError
  | MemberRegistrationPolicyError;

export type RegisterMemberView = Readonly<{
  kind: 'success';
  resource: Readonly<{
    id: string;
    organizationId: string;
    name: string;
  }>;
}> | Readonly<{
  kind: 'failure';
  error: PresentedError;
}>;

export class RegisterMemberPresenter {
  constructor(private readonly translator: MessageTranslator) {}

  present(
    result: Result<RegisterMemberOutput, RegisterMemberError>,
    context: ExecutionContext,
    locale: SupportedLocale,
  ): RegisterMemberView {
    if (!result.success) {
      return Object.freeze({
        kind: 'failure',
        error: presentError(result.error, context, locale, this.translator),
      });
    }

    return Object.freeze({
      kind: 'success',
      resource: Object.freeze({
        id: result.value.memberId.toString(),
        organizationId: result.value.organizationId.toString(),
        name: result.value.name,
      }),
    });
  }
}
