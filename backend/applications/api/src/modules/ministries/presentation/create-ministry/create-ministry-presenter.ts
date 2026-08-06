import type { CreateMinistryOutput } from '../../application';
import type { MinistryCreationPolicyError, MinistryNameError } from '../../domain';
import type { OrganizationIdError } from '@/modules/organizations/domain';
import type { ExecutionContext } from '@/shared/application/context';
import type { Result } from '@/shared/core/result';
import { presentError, type MessageTranslator, type PresentedError, type SupportedLocale } from '@/shared/presentation';

type CreateMinistryError = OrganizationIdError | MinistryNameError | MinistryCreationPolicyError;
export type CreateMinistryView = Readonly<{
  kind: 'success';
  resource: Readonly<{ id: string; organizationId: string; name: string; status: 'active' }>;
}> | Readonly<{ kind: 'failure'; error: PresentedError }>;

export class CreateMinistryPresenter {
  constructor(private readonly translator: MessageTranslator) {}

  present(result: Result<CreateMinistryOutput, CreateMinistryError>, context: ExecutionContext, locale: SupportedLocale): CreateMinistryView {
    if (!result.success) {
      return Object.freeze({ kind: 'failure', error: presentError(result.error, context, locale, this.translator) });
    }
    return Object.freeze({
      kind: 'success',
      resource: Object.freeze({
        id: result.value.ministryId.toString(),
        organizationId: result.value.organizationId.toString(),
        name: result.value.name,
        status: result.value.status,
      }),
    });
  }
}
