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

export function presentErrors(
  error: NotificationError & { readonly errors?: readonly NotificationError[] },
  context: ExecutionContext,
  locale: SupportedLocale,
  translator: MessageTranslator,
): readonly PresentedError[] {
  const source = error.errors ?? [error];
  return Object.freeze(source.map((error) => presentError(error, context, locale, translator)));
}

export function presentErrorGroup(
  errors: NotificationError & { readonly errors?: readonly NotificationError[] },
  context: ExecutionContext,
  locale: SupportedLocale,
  translator: MessageTranslator,
): Readonly<{ error: PresentedError; errors: readonly PresentedError[] }> {
  const presented = presentErrors(errors, context, locale, translator);
  const primary = presented[0];
  if (primary === undefined) throw new Error('presented_error.empty_collection');
  return Object.freeze({ error: primary, errors: presented });
}
