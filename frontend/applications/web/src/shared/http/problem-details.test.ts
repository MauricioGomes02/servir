import { describe, expect, it } from 'vitest';
import { fieldErrors } from './problem-details';

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
