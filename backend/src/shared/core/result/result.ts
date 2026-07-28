export interface Success<TValue> {
  readonly success: true;
  readonly value: TValue;
}

export interface Failure<TError> {
  readonly success: false;
  readonly error: TError;
}

export type Result<TValue, TError> =
  | Success<TValue>
  | Failure<TError>;

function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function copyStructuredError<TError>(error: TError): TError {
  if (Array.isArray(error)) {
    return Object.freeze(
      error.map((item) => copyStructuredError(item)),
    ) as TError;
  }

  if (
    error !== null
    && typeof error === 'object'
    && isPlainObject(error)
  ) {
    const entries = Object.entries(error).map(
      ([key, value]) => [key, copyStructuredError(value)],
    );

    return Object.freeze(
      Object.fromEntries(entries),
    ) as TError;
  }

  return error;
}

export function success(): Success<void>;

export function success<TValue>(
  value: TValue,
): Success<TValue>;

export function success<TValue>(
  value?: TValue,
): Success<TValue | void> {
  return Object.freeze({
    success: true,
    value,
  });
}

export function failure<TError>(
  error: TError,
): Failure<TError> {
  return Object.freeze({
    success: false,
    error: copyStructuredError(error),
  });
}
