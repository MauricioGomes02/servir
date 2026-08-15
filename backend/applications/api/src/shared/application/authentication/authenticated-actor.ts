import { failure, success, type Result } from '@/shared/core/result';

import {
  AuthenticatedActorErrorCodes,
  type AuthenticatedActorError,
} from './authenticated-actor-error';

const MAX_ISSUER_LENGTH = 2_048;
const MAX_SUBJECT_LENGTH = 255;

declare const issuerBrand: unique symbol;
declare const subjectBrand: unique symbol;

export type IdentityIssuer = string & { readonly [issuerBrand]: 'IdentityIssuer' };
export type IdentitySubject = string & { readonly [subjectBrand]: 'IdentitySubject' };

export interface AuthenticatedActor {
  readonly issuer: IdentityIssuer;
  readonly subject: IdentitySubject;
}

function parseIdentityValue<TValue extends string>(
  input: unknown,
  field: AuthenticatedActorError['field'],
  maxLength: number,
): Result<TValue, AuthenticatedActorError> {
  if (typeof input !== 'string') {
    return failure({ code: AuthenticatedActorErrorCodes.InvalidType, field });
  }

  if (input.length === 0) {
    return failure({ code: AuthenticatedActorErrorCodes.Empty, field });
  }

  if (input.length > maxLength) {
    return failure({
      code: AuthenticatedActorErrorCodes.TooLong,
      field,
      params: { maxLength, actualLength: input.length },
    });
  }

  return success(input as TValue);
}

export function parseIdentityIssuer(
  input: unknown,
): Result<IdentityIssuer, AuthenticatedActorError> {
  return parseIdentityValue(input, 'issuer', MAX_ISSUER_LENGTH);
}

export function parseIdentitySubject(
  input: unknown,
): Result<IdentitySubject, AuthenticatedActorError> {
  return parseIdentityValue(input, 'subject', MAX_SUBJECT_LENGTH);
}

export function createAuthenticatedActor(input: {
  readonly issuer: IdentityIssuer;
  readonly subject: IdentitySubject;
}): AuthenticatedActor {
  return Object.freeze({ ...input });
}
