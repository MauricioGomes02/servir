import { describe, expect, it } from 'vitest';
import { fieldErrors, HttpProblem } from './problem-details';

describe('fieldErrors', () => {
  it('returns only messages associated with the requested field', () => {
    expect(
      fieldErrors(
        {
          type: '/problems/validation-error',
          title: 'Invalid data',
          status: 422,
          errors: [
            { code: 'name.empty', detail: 'Informe um nome.', pointer: '#/name' },
            { code: 'email.empty', detail: 'Informe um e-mail.', pointer: '#/email' },
          ],
        },
        'name',
      ),
    ).toEqual(['Informe um nome.']);
  });
});

describe('HttpProblem', () => {
  it('uses a stable error code instead of localized text as its identity', () => {
    const error = new HttpProblem({
      type: '/problems/validation-error',
      title: 'Dados inválidos.',
      status: 422,
      errors: [{ code: 'organization.name.empty', detail: 'Informe o nome.' }],
    });

    expect(error.code).toBe('organization.name.empty');
    expect(error.message).toBe('organization.name.empty');
  });
});
