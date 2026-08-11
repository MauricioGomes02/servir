import type { MinistryTeamIdError } from '@/modules/ministries/domain';
import type { OrganizationIdError } from '@/modules/organizations/domain';
import type { ExecutionContext } from '@/shared/application/context';
import type { ValidationErrors } from '@/shared/application/validation';
import type { Result } from '@/shared/core/result';
import type { InstantError } from '@/shared/domain/instant';
import type { CivilDateError, SchedulePeriodError } from '@/shared/domain/temporal';
import {
  presentErrorGroup,
  type MessageCatalog,
  type MessageTranslator,
  type PresentedError,
  type SupportedLocale,
} from '@/shared/presentation';
import type { OpenAvailabilityRequestOutput } from '../application';
import type { AvailabilityRequestOpeningError } from '../domain';

type Error =
  | OrganizationIdError
  | MinistryTeamIdError
  | CivilDateError
  | SchedulePeriodError
  | InstantError
  | AvailabilityRequestOpeningError
  | ValidationErrors;
export type OpenAvailabilityRequestView =
  | Readonly<{
      kind: 'success';
      resource: Readonly<{
        id: string;
        organizationId: string;
        ministryTeamId: string;
        startDate: string;
        endDate: string;
        respondBy: string;
        status: 'open';
      }>;
    }>
  | Readonly<{ kind: 'failure'; error: PresentedError; errors: readonly PresentedError[] }>;

export class OpenAvailabilityRequestPresenter {
  constructor(private readonly translator: MessageTranslator) {}
  present(
    result: Result<OpenAvailabilityRequestOutput, Error>,
    context: ExecutionContext,
    locale: SupportedLocale,
  ): OpenAvailabilityRequestView {
    if (!result.success)
      return Object.freeze({
        kind: 'failure',
        ...presentErrorGroup(result.error, context, locale, this.translator),
      });
    return Object.freeze({
      kind: 'success',
      resource: Object.freeze({
        id: result.value.availabilityRequestId.toString(),
        organizationId: result.value.organizationId.toString(),
        ministryTeamId: result.value.ministryTeamId.toString(),
        startDate: result.value.startDate,
        endDate: result.value.endDate,
        respondBy: result.value.respondBy,
        status: result.value.status,
      }),
    });
  }
}

export const availabilityMessageCatalog: MessageCatalog = Object.freeze({
  'pt-BR': Object.freeze({
    'instant.invalid_type': 'O prazo de resposta deve ser um instante UTC em texto.',
    'instant.invalid_format': 'O prazo de resposta deve usar o formato UTC canônico.',
    'schedule_period.start_after_end': 'A data inicial não pode ser posterior à data final.',
    'availability_request.opening.team_not_active':
      'O time ministerial não foi encontrado ou não está ativo nesta organização.',
    'availability_request.opening.response_deadline_not_future':
      'O prazo de resposta deve estar no futuro.',
  }),
  'en-US': Object.freeze({
    'instant.invalid_type': 'The response deadline must be a textual UTC instant.',
    'instant.invalid_format': 'The response deadline must use the canonical UTC format.',
    'schedule_period.start_after_end': 'The start date cannot be after the end date.',
    'availability_request.opening.team_not_active':
      'The ministry team was not found or is not active in this organization.',
    'availability_request.opening.response_deadline_not_future':
      'The response deadline must be in the future.',
  }),
});
