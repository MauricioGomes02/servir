import { HttpProblemMessageCodes } from './http-problem-message-catalog';
import { HttpProblemTypes } from './http-problem-details';

export const PresentedHttpProblemKinds = {
  AuthenticationRequired: 'authentication-required',
  AuthorizationDenied: 'authorization-denied',
  InvalidRequest: 'invalid-request',
  ResourceConflict: 'resource-conflict',
  ResourceNotFound: 'resource-not-found',
  ValidationError: 'validation-error',
} as const;

export type PresentedHttpProblemKind =
  (typeof PresentedHttpProblemKinds)[keyof typeof PresentedHttpProblemKinds];

export interface PresentedHttpProblem {
  readonly status: number;
  readonly type: string;
  readonly titleCode: string;
}

export interface PresentedHttpProblemCodeMap {
  readonly authenticationRequired?: readonly string[];
  readonly authorizationDenied?: readonly string[];
  readonly invalidRequest?: readonly string[];
  readonly resourceConflict?: readonly string[];
  readonly resourceNotFound?: readonly string[];
  readonly fallback?: PresentedHttpProblemKind;
}

const problems: Readonly<Record<PresentedHttpProblemKind, PresentedHttpProblem>> = Object.freeze({
  [PresentedHttpProblemKinds.AuthenticationRequired]: Object.freeze({
    status: 401,
    type: HttpProblemTypes.AuthenticationRequired,
    titleCode: HttpProblemMessageCodes.AuthenticationRequiredTitle,
  }),
  [PresentedHttpProblemKinds.AuthorizationDenied]: Object.freeze({
    status: 403,
    type: HttpProblemTypes.AuthorizationDenied,
    titleCode: HttpProblemMessageCodes.AuthorizationDeniedTitle,
  }),
  [PresentedHttpProblemKinds.InvalidRequest]: Object.freeze({
    status: 400,
    type: HttpProblemTypes.InvalidRequest,
    titleCode: HttpProblemMessageCodes.InvalidRequestTitle,
  }),
  [PresentedHttpProblemKinds.ResourceConflict]: Object.freeze({
    status: 409,
    type: HttpProblemTypes.ResourceConflict,
    titleCode: HttpProblemMessageCodes.ResourceConflictTitle,
  }),
  [PresentedHttpProblemKinds.ResourceNotFound]: Object.freeze({
    status: 404,
    type: HttpProblemTypes.ResourceNotFound,
    titleCode: HttpProblemMessageCodes.ResourceNotFoundTitle,
  }),
  [PresentedHttpProblemKinds.ValidationError]: Object.freeze({
    status: 422,
    type: HttpProblemTypes.ValidationError,
    titleCode: HttpProblemMessageCodes.ValidationErrorTitle,
  }),
});

export function presentedHttpProblem(kind: PresentedHttpProblemKind): PresentedHttpProblem {
  return problems[kind];
}

export function presentedHttpProblemForCode(
  code: string,
  map: PresentedHttpProblemCodeMap,
): PresentedHttpProblem {
  if (map.authenticationRequired?.includes(code) === true) {
    return presentedHttpProblem(PresentedHttpProblemKinds.AuthenticationRequired);
  }
  if (map.authorizationDenied?.includes(code) === true) {
    return presentedHttpProblem(PresentedHttpProblemKinds.AuthorizationDenied);
  }
  if (map.invalidRequest?.includes(code) === true) {
    return presentedHttpProblem(PresentedHttpProblemKinds.InvalidRequest);
  }
  if (map.resourceNotFound?.includes(code) === true) {
    return presentedHttpProblem(PresentedHttpProblemKinds.ResourceNotFound);
  }
  if (map.resourceConflict?.includes(code) === true) {
    return presentedHttpProblem(PresentedHttpProblemKinds.ResourceConflict);
  }
  return presentedHttpProblem(map.fallback ?? PresentedHttpProblemKinds.ValidationError);
}
