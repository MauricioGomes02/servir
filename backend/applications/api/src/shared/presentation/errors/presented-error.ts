import type { ExecutionContext } from '@/shared/application/context';
import type { NotificationError, NotificationErrorParams } from '@/shared/domain/notification';
import type { MessageTranslator, SupportedLocale } from '@/shared/presentation/localization';

export interface PresentedError {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
  readonly parameters?: NotificationErrorParams;
  readonly correlationId: string;
}

export function presentError(
  error: NotificationError,
  context: ExecutionContext,
  locale: SupportedLocale,
  translator: MessageTranslator,
): PresentedError {
  return Object.freeze({
    code: error.code,
    message: translator.translate({
      code: error.code,
      locale,
      parameters: error.params,
    }),
    field: error.field,
    parameters: error.params ? Object.freeze({ ...error.params }) : undefined,
    correlationId: context.correlationId,
  });
}
