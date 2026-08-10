import type { ExecutionContext } from '@/shared/application/context';
import type { Result } from '@/shared/core/result';
import {
  presentError,
  type MessageTranslator,
  type PresentedError,
  type SupportedLocale,
} from '@/shared/presentation';
import type { AssignMemberToTeamError, AssignMemberToTeamOutput } from '../../application';
export type AssignMemberToTeamView =
  | Readonly<{
      kind: 'success';
      resource: Readonly<{
        id: string;
        organizationId: string;
        ministryId: string;
        ministryTeamId: string;
        ministryMembershipId: string;
        status: 'active';
        assignedAt: string;
      }>;
    }>
  | Readonly<{ kind: 'failure'; error: PresentedError }>;
export class AssignMemberToTeamPresenter {
  constructor(private readonly translator: MessageTranslator) {}
  present(
    result: Result<AssignMemberToTeamOutput, AssignMemberToTeamError>,
    context: ExecutionContext,
    locale: SupportedLocale,
  ): AssignMemberToTeamView {
    if (!result.success)
      return Object.freeze({
        kind: 'failure',
        error: presentError(result.error, context, locale, this.translator),
      });
    return Object.freeze({
      kind: 'success',
      resource: Object.freeze({
        id: result.value.teamMembershipId.value,
        organizationId: result.value.organizationId.value,
        ministryId: result.value.ministryId.value,
        ministryTeamId: result.value.ministryTeamId.value,
        ministryMembershipId: result.value.ministryMembershipId.value,
        status: result.value.status,
        assignedAt: result.value.assignedAt,
      }),
    });
  }
}
