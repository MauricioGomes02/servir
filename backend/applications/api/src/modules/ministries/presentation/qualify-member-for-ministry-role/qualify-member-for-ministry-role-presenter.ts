import type { ExecutionContext } from '@/shared/application/context';
import type { Result } from '@/shared/core/result';
import {
  presentErrorGroup,
  type MessageTranslator,
  type PresentedError,
  type SupportedLocale,
} from '@/shared/presentation';
import type {
  QualifyMemberForMinistryRoleError,
  QualifyMemberForMinistryRoleOutput,
} from '../../application';
export type QualifyMemberForMinistryRoleView =
  | Readonly<{
      kind: 'success';
      resource: Readonly<{
        id: string;
        ministryMembershipId: string;
        organizationId: string;
        ministryId: string;
        ministryRoleId: string;
        status: 'active';
        qualifiedAt: string;
      }>;
    }>
  | Readonly<{ kind: 'failure'; error: PresentedError; errors: readonly PresentedError[] }>;
export class QualifyMemberForMinistryRolePresenter {
  constructor(private readonly translator: MessageTranslator) {}
  present(
    result: Result<QualifyMemberForMinistryRoleOutput, QualifyMemberForMinistryRoleError>,
    context: ExecutionContext,
    locale: SupportedLocale,
  ): QualifyMemberForMinistryRoleView {
    if (!result.success)
      return Object.freeze({
        kind: 'failure',
        ...presentErrorGroup(result.error, context, locale, this.translator),
      });
    return Object.freeze({
      kind: 'success',
      resource: Object.freeze({
        id: result.value.ministryRoleQualificationId.value,
        ministryMembershipId: result.value.ministryMembershipId.value,
        organizationId: result.value.organizationId.value,
        ministryId: result.value.ministryId.value,
        ministryRoleId: result.value.ministryRoleId.value,
        status: result.value.status,
        qualifiedAt: result.value.qualifiedAt,
      }),
    });
  }
}
