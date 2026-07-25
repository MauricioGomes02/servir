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
    error,
  });
}