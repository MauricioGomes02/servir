import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFetchHttpClient, HttpClientErrorCodes } from './http-client';
import type { HttpClientError } from './http-client';
import type { HttpProblem } from './problem-details';

afterEach(() => vi.unstubAllGlobals());

describe('fetch HTTP client', () => {
  it('preserves the stable code returned by a Problem Details response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            type: '/problems/validation-error',
            title: 'Invalid data.',
            status: 422,
            errors: [{ code: 'organization.name.empty', detail: 'Enter the name.' }],
          }),
          { status: 422, headers: { 'content-type': 'application/problem+json' } },
        ),
      ),
    );

    await expect(createFetchHttpClient().get('/bff/organizations')).rejects.toMatchObject({
      code: 'organization.name.empty',
      name: 'HttpProblem',
    } satisfies Partial<HttpProblem>);
  });

  it('codes transport defects and preserves their cause', async () => {
    const cause = new TypeError('network unavailable');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(cause));

    await expect(createFetchHttpClient().get('/bff/organizations')).rejects.toMatchObject({
      cause,
      code: HttpClientErrorCodes.RequestFailed,
      name: 'HttpClientError',
    } satisfies Partial<HttpClientError>);
  });

  it('accepts a successful response without content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(createFetchHttpClient().post('/bff/auth/logout', {})).resolves.toBeUndefined();
  });
});
