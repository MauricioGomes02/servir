import { failure, success, type Result } from '@/shared/core/result';
import { Notification, type NotificationError } from '@/shared/domain/notification';

type ResultValue<TResult> =
  Extract<TResult, { readonly success: true }> extends {
    readonly value: infer TValue;
  }
    ? TValue
    : never;
export interface ValidationErrors extends NotificationError {
  readonly errors: readonly [NotificationError, ...NotificationError[]];
}

export function combineValidationResults<
  const TResults extends readonly Result<unknown, NotificationError>[],
>(
  ...results: TResults
): Result<
  Readonly<{ [TIndex in keyof TResults]: ResultValue<TResults[TIndex]> }>,
  ValidationErrors
> {
  const notification = new Notification();
  const values: unknown[] = [];

  for (const result of results) {
    if (result.success) values.push(result.value);
    else if ('errors' in result.error && Array.isArray(result.error.errors))
      notification.addMany(result.error.errors as readonly NotificationError[]);
    else notification.add(result.error);
  }

  if (notification.hasErrors()) {
    const errors = notification.getErrors() as ValidationErrors['errors'];
    const primary = errors[0];
    if (primary === undefined) throw new Error('validation_errors.empty_collection');
    return failure(Object.freeze({ ...primary, errors }) as ValidationErrors);
  }

  return success(
    Object.freeze(values) as Readonly<{
      [TIndex in keyof TResults]: ResultValue<TResults[TIndex]>;
    }>,
  );
}
