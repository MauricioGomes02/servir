import type {
  CreateOrganizationError,
  CreateOrganizationOutput,
} from '@/modules/organizations/application';
import type { ExecutionContext } from '@/shared/application/context';
import type { Result } from '@/shared/core/result';
import {
  presentError,
  type MessageTranslator,
  type PresentedError,
  type SupportedLocale,
} from '@/shared/presentation';

export interface CreateOrganizationSuccessView {
  readonly kind: 'success';
  readonly resource: Readonly<{
    id: string;
    name: string;
  }>;
}

export interface CreateOrganizationFailureView {
  readonly kind: 'failure';
  readonly error: PresentedError;
}

export type CreateOrganizationView = CreateOrganizationSuccessView | CreateOrganizationFailureView;

export class CreateOrganizationPresenter {
  constructor(private readonly translator: MessageTranslator) {}

  present(
    result: Result<CreateOrganizationOutput, CreateOrganizationError>,
    context: ExecutionContext,
    locale: SupportedLocale,
  ): CreateOrganizationView {
    if (!result.success) {
      return Object.freeze({
        kind: 'failure',
        error: presentError(result.error, context, locale, this.translator),
      });
    }

    return Object.freeze({
      kind: 'success',
      resource: Object.freeze({
        id: result.value.organizationId.toString(),
        name: result.value.name,
      }),
    });
  }
}
