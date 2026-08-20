import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  presentedHttpProblem,
  presentedHttpProblemForCode,
  PresentedHttpProblemKinds,
} from './presented-http-problem';

describe('presentedHttpProblem', () => {
  it('maps every category to one stable status and problem type', () => {
    const cases = [
      [PresentedHttpProblemKinds.InvalidRequest, 400, '/problems/invalid-request'],
      [PresentedHttpProblemKinds.AuthenticationRequired, 401, '/problems/authentication-required'],
      [PresentedHttpProblemKinds.AuthorizationDenied, 403, '/problems/authorization-denied'],
      [PresentedHttpProblemKinds.ResourceNotFound, 404, '/problems/resource-not-found'],
      [PresentedHttpProblemKinds.ResourceConflict, 409, '/problems/resource-conflict'],
      [PresentedHttpProblemKinds.ValidationError, 422, '/problems/validation-error'],
    ] as const;

    for (const [kind, status, type] of cases) {
      assert.deepEqual(
        { status: presentedHttpProblem(kind).status, type: presentedHttpProblem(kind).type },
        { status, type },
      );
    }
  });
});

describe('presentedHttpProblemForCode', () => {
  it('maps codes from every configured category', () => {
    const cases = [
      ['authentication.required', 'authenticationRequired', 401],
      ['authorization.denied', 'authorizationDenied', 403],
      ['request.invalid', 'invalidRequest', 400],
      ['resource.missing', 'resourceNotFound', 404],
      ['resource.conflict', 'resourceConflict', 409],
    ] as const;

    for (const [code, category, status] of cases) {
      assert.equal(presentedHttpProblemForCode(code, { [category]: [code] }).status, status);
    }
  });

  it('uses validation error as the default expected failure', () => {
    assert.equal(presentedHttpProblemForCode('value.invalid', {}).status, 422);
  });

  it('supports an explicit fallback category', () => {
    assert.equal(
      presentedHttpProblemForCode('request.invalid', {
        fallback: PresentedHttpProblemKinds.InvalidRequest,
      }).status,
      400,
    );
  });
});
