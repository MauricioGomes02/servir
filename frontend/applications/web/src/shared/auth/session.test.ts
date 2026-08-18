import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSession, googleLoginUrl } from './session';

afterEach(() => vi.unstubAllGlobals());

describe('web authentication session', () => {
  it('reads the opaque session state without exposing credentials', async () => {
    const snapshot = {
      authenticationEnabled: true,
      authenticated: true,
      userId: 'user-id',
    } as const;
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(snapshot)));
    vi.stubGlobal('fetch', fetch);

    await expect(getSession()).resolves.toEqual(snapshot);
    expect(fetch).toHaveBeenCalledWith(
      '/bff/auth/session',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('encodes only a local return path into the Google login request', () => {
    expect(googleLoginUrl('/organizations/id?tab=members')).toBe(
      '/bff/auth/google/login?returnPath=%2Forganizations%2Fid%3Ftab%3Dmembers',
    );
  });
});
