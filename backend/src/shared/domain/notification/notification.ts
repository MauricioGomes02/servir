import {
  type NotificationError,
} from './notification-error';

function copyError<TCode extends string>(
  error: NotificationError<TCode>,
): NotificationError<TCode> {
  return Object.freeze({
    ...error,
    params: error.params
      ? Object.freeze({ ...error.params })
      : undefined,
  });
}

export class Notification<
  TCode extends string = string,
> {
  private readonly items: NotificationError<TCode>[] = [];

  add(error: NotificationError<TCode>): this {
    this.items.push(copyError(error));

    return this;
  }

  addMany(
    errors: readonly NotificationError<TCode>[],
  ): this {
    this.items.push(...errors.map((error) => copyError(error)));

    return this;
  }

  merge(
    notification: Notification<TCode>,
  ): this {
    this.items.push(...notification.getErrors());

    return this;
  }

  hasErrors(): boolean {
    return this.items.length > 0;
  }

  isValid(): boolean {
    return !this.hasErrors();
  }

  hasErrorCode(code: TCode): boolean {
    return this.items.some(
      error => error.code === code,
    );
  }

  hasErrorForField(field: string): boolean {
    return this.items.some(
      error => error.field === field,
    );
  }

  getErrors(): readonly NotificationError<TCode>[] {
    return Object.freeze([...this.items]);
  }

  getErrorsForField(
    field: string,
  ): readonly NotificationError<TCode>[] {
    return Object.freeze(
      this.items.filter(
        error => error.field === field,
      ),
    );
  }

  get size(): number {
    return this.items.length;
  }
}
