import type {
  CivilScheduleResolutionError,
  ScheduleManualActivityOccurrenceOutput,
} from '../application';
import type { ActivityIdError, ActivityOccurrenceSchedulingError } from '../domain';
import type { OrganizationIdError } from '@/modules/organizations/domain';
import type { ExecutionContext } from '@/shared/application/context';
import type { ValidationErrors } from '@/shared/application/validation';
import type { Result } from '@/shared/core/result';
import type { CivilDateError, CivilTimeError, TimeZoneIdError } from '@/shared/domain/temporal';
import {
  presentErrorGroup,
  type MessageTranslator,
  type PresentedError,
  type SupportedLocale,
} from '@/shared/presentation';

type Error =
  | OrganizationIdError
  | ActivityIdError
  | CivilDateError
  | CivilTimeError
  | TimeZoneIdError
  | CivilScheduleResolutionError
  | ActivityOccurrenceSchedulingError
  | ValidationErrors;

export type ScheduleManualActivityOccurrenceView =
  | Readonly<{
      kind: 'success';
      resource: Readonly<{
        id: string;
        organizationId: string;
        activityId: string;
        date: string;
        time: string;
        timeZoneId: string;
        resolvedOffset: string;
        scheduledAt: string;
        origin: 'manual';
        revision: 1;
        status: 'scheduled';
      }>;
    }>
  | Readonly<{ kind: 'failure'; error: PresentedError; errors: readonly PresentedError[] }>;

export class ScheduleManualActivityOccurrencePresenter {
  constructor(private readonly translator: MessageTranslator) {}
  present(
    result: Result<ScheduleManualActivityOccurrenceOutput, Error>,
    context: ExecutionContext,
    locale: SupportedLocale,
  ): ScheduleManualActivityOccurrenceView {
    if (!result.success)
      return Object.freeze({
        kind: 'failure',
        ...presentErrorGroup(result.error, context, locale, this.translator),
      });
    return Object.freeze({
      kind: 'success',
      resource: Object.freeze({
        id: result.value.activityOccurrenceId.toString(),
        organizationId: result.value.organizationId.toString(),
        activityId: result.value.activityId.toString(),
        date: result.value.civilDate,
        time: result.value.civilTime,
        timeZoneId: result.value.timeZoneId,
        resolvedOffset: result.value.resolvedOffset,
        scheduledAt: result.value.scheduledAt,
        origin: result.value.origin,
        revision: result.value.revision,
        status: result.value.status,
      }),
    });
  }
}
