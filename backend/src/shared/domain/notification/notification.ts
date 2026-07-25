import {
  NotificationError,
} from './notification-error';

export class Notification<
  TCode extends string = string,
> {
  private readonly items: NotificationError<TCode>[] = [];

  add(error: NotificationError<TCode>): this {
    this.items.push(error);

    return this;
  }

  addMany(
    errors: readonly NotificationError<TCode>[],
  ): this {
    this.items.push(...errors);

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
    return [...this.items];
  }

  getErrorsForField(
    field: string,
  ): readonly NotificationError<TCode>[] {
    return this.items.filter(
      error => error.field === field,
    );
  }

  get size(): number {
    return this.items.length;
  }
}