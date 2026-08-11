import type { ExecutionContext } from '@/shared/application/context';
import type { Result } from '@/shared/core/result';
import {
  presentError,
  type MessageTranslator,
  type PresentedError,
  type SupportedLocale,
} from '@/shared/presentation';
import type { AppointTeamLeaderError, AppointTeamLeaderOutput } from '../../application';

export type AppointTeamLeaderView =
  | Readonly<{
      kind: 'success';
      resource: Readonly<{
        id: string;
        organizationId: string;
        ministryId: string;
        ministryTeamId: string;
        teamMembershipId: string;
        status: 'active';
        appointedAt: string;
      }>;
    }>
  | Readonly<{ kind: 'failure'; error: PresentedError }>;

export class AppointTeamLeaderPresenter {
  constructor(private readonly translator: MessageTranslator) {}

  present(
    result: Result<AppointTeamLeaderOutput, AppointTeamLeaderError>,
    context: ExecutionContext,
    locale: SupportedLocale,
  ): AppointTeamLeaderView {
    if (!result.success)
      return Object.freeze({
        kind: 'failure',
        error: presentError(result.error, context, locale, this.translator),
      });
    return Object.freeze({
      kind: 'success',
      resource: Object.freeze({
        id: result.value.teamLeadershipId.value,
        organizationId: result.value.organizationId.value,
        ministryId: result.value.ministryId.value,
        ministryTeamId: result.value.ministryTeamId.value,
        teamMembershipId: result.value.teamMembershipId.value,
        status: result.value.status,
        appointedAt: result.value.appointedAt,
      }),
    });
  }
}
