import type { ExecutionContext } from '@/shared/application/context';
import type { Result } from '@/shared/core/result';
import {
  presentError,
  type MessageTranslator,
  type PresentedError,
  type SupportedLocale,
} from '@/shared/presentation';
import type { CreateMinistryTeamError, CreateMinistryTeamOutput } from '../../application';
export type CreateMinistryTeamView =
  | Readonly<{
      kind: 'success';
      resource: Readonly<{
        id: string;
        organizationId: string;
        ministryId: string;
        name: string;
        status: 'active';
      }>;
    }>
  | Readonly<{ kind: 'failure'; error: PresentedError }>;
export class CreateMinistryTeamPresenter {
  constructor(private readonly translator: MessageTranslator) {}
  present(
    result: Result<CreateMinistryTeamOutput, CreateMinistryTeamError>,
    context: ExecutionContext,
    locale: SupportedLocale,
  ): CreateMinistryTeamView {
    if (!result.success)
      return Object.freeze({
        kind: 'failure',
        error: presentError(result.error, context, locale, this.translator),
      });
    return Object.freeze({
      kind: 'success',
      resource: Object.freeze({
        id: result.value.ministryTeamId.value,
        organizationId: result.value.organizationId.value,
        ministryId: result.value.ministryId.value,
        name: result.value.name,
        status: result.value.status,
      }),
    });
  }
}
