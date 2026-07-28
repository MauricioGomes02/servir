import type { CreateOrganizationOutput } from '@/modules/organizations/application';
import type { OrganizationNameError } from '@/modules/organizations/domain';
import type { ExecutionContext } from '@/shared/application/context';
import type { Result } from '@/shared/core/result';
import {
  presentError,
  type MessageTranslator,
  type PresentedError,
  type SupportedLocale,
} from '@/shared/presentation';

export interface CreateOrganizationSuccessView {
  readonly success: true;
  readonly data: Readonly<{
    organizationId: string;
  }>;
}

export interface CreateOrganizationFailureView {
  readonly success: false;
  readonly error: PresentedError;
}

export type CreateOrganizationView =
  | CreateOrganizationSuccessView
  | CreateOrganizationFailureView;

export class CreateOrganizationPresenter {
  constructor(private readonly translator: MessageTranslator) {}

  present(
    result: Result<CreateOrganizationOutput, OrganizationNameError>,
    context: ExecutionContext,
    locale: SupportedLocale,
  ): CreateOrganizationView {
    if (!result.success) {
      return Object.freeze({
        success: false,
        error: presentError(
          result.error,
          context,
          locale,
          this.translator,
        ),
      });
    }

    return Object.freeze({
      success: true,
      data: Object.freeze({
        organizationId: result.value.organizationId.toString(),
      }),
    });
  }
}
