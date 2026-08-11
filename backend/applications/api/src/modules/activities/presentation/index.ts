import type { OrganizationIdError } from '@/modules/organizations/domain';
import type { ExecutionContext } from '@/shared/application/context';
import type { ValidationErrors } from '@/shared/application/validation';
import type { Result } from '@/shared/core/result';
import {
  presentErrorGroup,
  type MessageCatalog,
  type MessageTranslator,
  type PresentedError,
  type SupportedLocale,
} from '@/shared/presentation';

import type { CreateActivityOutput } from '../application';
import type { ActivityCreationError, ActivityNameError } from '../domain';

type CreateActivityError =
  OrganizationIdError | ActivityNameError | ActivityCreationError | ValidationErrors;

export type CreateActivityView =
  | Readonly<{
      kind: 'success';
      resource: Readonly<{
        id: string;
        organizationId: string;
        name: string;
        ministryIds: readonly string[];
        status: 'active';
      }>;
    }>
  | Readonly<{ kind: 'failure'; error: PresentedError; errors: readonly PresentedError[] }>;

export class CreateActivityPresenter {
  constructor(private readonly translator: MessageTranslator) {}

  present(
    result: Result<CreateActivityOutput, CreateActivityError>,
    context: ExecutionContext,
    locale: SupportedLocale,
  ): CreateActivityView {
    if (!result.success)
      return Object.freeze({
        kind: 'failure',
        ...presentErrorGroup(result.error, context, locale, this.translator),
      });
    return Object.freeze({
      kind: 'success',
      resource: Object.freeze({
        id: result.value.activityId.toString(),
        organizationId: result.value.organizationId.toString(),
        name: result.value.name,
        ministryIds: Object.freeze([...result.value.ministryIds]),
        status: result.value.status,
      }),
    });
  }
}

export {
  ScheduleManualActivityOccurrencePresenter,
  type ScheduleManualActivityOccurrenceView,
} from './schedule-manual-activity-occurrence-presenter';

export const activityMessageCatalog: MessageCatalog = Object.freeze({
  'pt-BR': Object.freeze({
    'activity.name.invalid_type': 'O nome da atividade deve ser um texto.',
    'activity.name.empty': 'Informe o nome da atividade.',
    'activity.name.too_long': 'O nome da atividade deve ter no máximo {maxLength} caracteres.',
    'activity.creation.ministry_ids_invalid_type': 'Informe uma lista de ministérios.',
    'activity.creation.organization_not_found': 'A organização informada não foi encontrada.',
    'activity.creation.active_name_already_exists':
      'Já existe uma atividade ativa com este nome na organização.',
    'activity.creation.ministries_required': 'Informe pelo menos um ministério participante.',
    'activity.creation.duplicate_ministry': 'Não repita ministérios participantes.',
    'activity.creation.ministry_not_active':
      'Um dos ministérios não foi encontrado ou não está ativo nesta organização.',
    'civil_date.invalid_type': 'A data deve ser um texto no formato AAAA-MM-DD.',
    'civil_date.invalid_format': 'A data deve usar o formato AAAA-MM-DD.',
    'civil_date.invalid_value': 'A data informada não existe no calendário.',
    'civil_time.invalid_type': 'O horário deve ser um texto no formato HH:mm.',
    'civil_time.invalid_format': 'O horário deve usar o formato HH:mm.',
    'civil_time.invalid_value': 'O horário informado não é válido.',
    'time_zone_id.invalid_type': 'A timezone deve ser um texto.',
    'time_zone_id.invalid_format': 'Informe uma timezone IANA, não um offset fixo.',
    'time_zone_id.unknown': 'A timezone informada não foi reconhecida.',
    'activity_occurrence.schedule.invalid_disambiguation':
      'A desambiguação deve ser earlier ou later.',
    'activity_occurrence.schedule.nonexistent_local_time':
      'Este horário civil não existe nesta data e timezone.',
    'activity_occurrence.schedule.ambiguous_local_time':
      'Este horário ocorre duas vezes; escolha earlier ou later.',
    'activity_occurrence.scheduling.activity_not_active':
      'A atividade não foi encontrada ou não está ativa nesta organização.',
    'activity_occurrence.scheduling.scheduled_at_already_exists':
      'Já existe uma ocorrência vigente desta atividade neste instante.',
  }),
  'en-US': Object.freeze({
    'activity.name.invalid_type': 'The activity name must be text.',
    'activity.name.empty': 'Enter the activity name.',
    'activity.name.too_long': 'The activity name must have at most {maxLength} characters.',
    'activity.creation.ministry_ids_invalid_type': 'Provide a list of ministries.',
    'activity.creation.organization_not_found': 'The specified organization was not found.',
    'activity.creation.active_name_already_exists':
      'An active activity with this name already exists in the organization.',
    'activity.creation.ministries_required': 'Provide at least one participating ministry.',
    'activity.creation.duplicate_ministry': 'Do not repeat participating ministries.',
    'activity.creation.ministry_not_active':
      'A ministry was not found or is not active in this organization.',
    'civil_date.invalid_type': 'The date must be text in YYYY-MM-DD format.',
    'civil_date.invalid_format': 'The date must use YYYY-MM-DD format.',
    'civil_date.invalid_value': 'The specified calendar date does not exist.',
    'civil_time.invalid_type': 'The time must be text in HH:mm format.',
    'civil_time.invalid_format': 'The time must use HH:mm format.',
    'civil_time.invalid_value': 'The specified time is invalid.',
    'time_zone_id.invalid_type': 'The timezone must be text.',
    'time_zone_id.invalid_format': 'Provide an IANA timezone, not a fixed offset.',
    'time_zone_id.unknown': 'The specified timezone was not recognized.',
    'activity_occurrence.schedule.invalid_disambiguation':
      'Disambiguation must be earlier or later.',
    'activity_occurrence.schedule.nonexistent_local_time':
      'This civil time does not exist on the specified date and timezone.',
    'activity_occurrence.schedule.ambiguous_local_time':
      'This time occurs twice; choose earlier or later.',
    'activity_occurrence.scheduling.activity_not_active':
      'The activity was not found or is not active in this organization.',
    'activity_occurrence.scheduling.scheduled_at_already_exists':
      'A current occurrence of this activity already exists at this instant.',
  }),
});
