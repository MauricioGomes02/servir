export interface Success<TValue> {
  readonly success: true;
  readonly value: TValue;
}

export interface Failure<TError> {
  readonly success: false;
  readonly error: TError;
}

export type Result<TValue, TError> = Success<TValue> | Failure<TError>;

function isPlainObject(value: object): boolean {
  const prototype: unknown = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function copyStructuredError(error: unknown): unknown {
  if (Array.isArray(error)) {
    const items: unknown[] = error;
    return Object.freeze(items.map((item) => copyStructuredError(item)));
  }

  if (error !== null && typeof error === 'object' && isPlainObject(error)) {
    const entries = Object.entries(error as Record<string, unknown>).map(([key, value]) => [
      key,
      copyStructuredError(value),
    ]);

    return Object.freeze(Object.fromEntries(entries));
  }

  return error;
}

export function success(): Success<void>;

export function success<TValue>(value: TValue): Success<TValue>;

export function success<TValue>(value?: TValue): Success<TValue | void> {
  return Object.freeze({
    success: true,
    value,
  });
}

export function failure<TError>(error: TError): Failure<TError> {
  return Object.freeze({
    success: false,
    error: copyStructuredError(error) as TError,
  });
}
