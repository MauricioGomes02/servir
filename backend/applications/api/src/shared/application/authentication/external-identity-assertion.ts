import { failure, success, type Result } from '@/shared/core/result';

import {
  ExternalIdentityAssertionErrorCodes,
  type ExternalIdentityAssertionError,
} from './external-identity-assertion-error';

const MAX_ISSUER_LENGTH = 255;
const MAX_SUBJECT_LENGTH = 255;

declare const issuerBrand: unique symbol;
declare const subjectBrand: unique symbol;

export type IdentityIssuer = string & { readonly [issuerBrand]: 'IdentityIssuer' };
export type IdentitySubject = string & { readonly [subjectBrand]: 'IdentitySubject' };

export interface ExternalIdentityAssertion {
  readonly issuer: IdentityIssuer;
  readonly subject: IdentitySubject;
}

function parseIdentityValue<TValue extends string>(
  input: unknown,
  field: ExternalIdentityAssertionError['field'],
  maxLength: number,
): Result<TValue, ExternalIdentityAssertionError> {
  if (typeof input !== 'string') {
    return failure({ code: ExternalIdentityAssertionErrorCodes.InvalidType, field });
  }

  if (input.length === 0) {
    return failure({ code: ExternalIdentityAssertionErrorCodes.Empty, field });
  }

  if (input.length > maxLength) {
    return failure({
      code: ExternalIdentityAssertionErrorCodes.TooLong,
      field,
      params: { maxLength, actualLength: input.length },
    });
  }

  return success(input as TValue);
}

export function parseIdentityIssuer(
  input: unknown,
): Result<IdentityIssuer, ExternalIdentityAssertionError> {
  return parseIdentityValue(input, 'issuer', MAX_ISSUER_LENGTH);
}

export function parseIdentitySubject(
  input: unknown,
): Result<IdentitySubject, ExternalIdentityAssertionError> {
  return parseIdentityValue(input, 'subject', MAX_SUBJECT_LENGTH);
}

export function createExternalIdentityAssertion(input: {
  readonly issuer: IdentityIssuer;
  readonly subject: IdentitySubject;
}): ExternalIdentityAssertion {
  return Object.freeze({ ...input });
}
