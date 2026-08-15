import type { ActivityPage, ListActivitiesError } from '../application';
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

export type ListActivitiesView =
  | Readonly<{
      kind: 'success';
      resource: Readonly<{
        items: readonly Readonly<{
          id: string;
          name: string;
          status: string;
          ministryCount: number;
        }>[];
        pagination: ActivityPage['pagination'];
      }>;
    }>
  | Readonly<{ kind: 'failure'; error: PresentedError; errors: readonly PresentedError[] }>;

export class ListActivitiesPresenter {
  constructor(private readonly translator: MessageTranslator) {}

  present(
    result: Result<ActivityPage, OrganizationIdError | ListActivitiesError | ValidationErrors>,
    context: ExecutionContext,
    locale: SupportedLocale,
  ): ListActivitiesView {
    if (!result.success)
      return Object.freeze({
        kind: 'failure',
        ...presentErrorGroup(result.error, context, locale, this.translator),
      });
    return Object.freeze({
      kind: 'success',
      resource: Object.freeze({
        items: Object.freeze(
          result.value.items.map((item) =>
            Object.freeze({
              id: item.id.toString(),
              name: item.name,
              status: item.status,
              ministryCount: item.ministryCount,
            }),
          ),
        ),
        pagination: result.value.pagination,
      }),
    });
  }
}
