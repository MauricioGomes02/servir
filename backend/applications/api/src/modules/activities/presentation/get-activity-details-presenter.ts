import type { ActivityDetails, GetActivityDetailsError } from '../application';
import type { ActivityIdError } from '../domain';
import type { OrganizationIdError } from '@/modules/organizations/domain';
import type { ExecutionContext } from '@/shared/application/context';
import type { ValidationErrors } from '@/shared/application/validation';
import type { Result } from '@/shared/core/result';
import {
  presentErrorGroup,
  type MessageTranslator,
  type PresentedError,
  type SupportedLocale,
} from '@/shared/presentation';

export type GetActivityDetailsView =
  | Readonly<{
      kind: 'success';
      resource: Readonly<{
        id: string;
        name: string;
        status: string;
        ministries: readonly Readonly<{ id: string; name: string }>[];
      }>;
    }>
  | Readonly<{ kind: 'failure'; error: PresentedError; errors: readonly PresentedError[] }>;

export class GetActivityDetailsPresenter {
  constructor(private readonly translator: MessageTranslator) {}

  present(
    result: Result<
      ActivityDetails,
      OrganizationIdError | ActivityIdError | GetActivityDetailsError | ValidationErrors
    >,
    context: ExecutionContext,
    locale: SupportedLocale,
  ): GetActivityDetailsView {
    if (!result.success)
      return Object.freeze({
        kind: 'failure',
        ...presentErrorGroup(result.error, context, locale, this.translator),
      });
    return Object.freeze({
      kind: 'success',
      resource: Object.freeze({
        id: result.value.id.toString(),
        name: result.value.name,
        status: result.value.status,
        ministries: Object.freeze(
          result.value.ministries.map((ministry) => Object.freeze(ministry)),
        ),
      }),
    });
  }
}
