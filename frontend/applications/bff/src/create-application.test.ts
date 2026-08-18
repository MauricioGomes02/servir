import { afterEach, describe, expect, it, vi } from 'vitest';
import { base64url, exportJWK, generateKeyPair, jwtVerify } from 'jose';
import { AuthenticationCookieCodec } from './authentication/authentication-cookie-codec.js';
import type { OidcLoginTransaction, OidcProvider } from './authentication/oidc-provider.js';
import { InternalCredentialIssuer } from './authentication/internal-credential-issuer.js';
import { createApplication } from './create-application.js';

const config = {
  apiBaseUrl: new URL('http://private-api:3000'),
  apiTimeoutMs: 10_000,
  host: '0.0.0.0',
  port: 3001,
};

afterEach(() => vi.unstubAllGlobals());

describe('frontend BFF', () => {
  it('starts Google login with an encrypted host cookie and a safe return path', async () => {
    let receivedTransaction: OidcLoginTransaction | undefined;
    const oidcProvider: OidcProvider = {
      createAuthorizationUrl: async (transaction) => {
        receivedTransaction = transaction;
        return new URL(`https://accounts.google.test/authorize?state=${transaction.state}`);
      },
      verifyCallback: async () => ({ issuer: 'issuer', subject: 'subject' }),
    };
    const cookieCodec = new AuthenticationCookieCodec({
      encryptionKey: base64url.encode(new Uint8Array(32).fill(3)),
      issuer: 'https://identity.servir.test',
      loginTransactionTtlSeconds: 300,
    });
    const pair = await generateKeyPair('RS256', { extractable: true });
    const credentialIssuer = await InternalCredentialIssuer.create({
      accessTokenTtlSeconds: 300,
      algorithm: 'RS256',
      audience: 'servir-api',
      bootstrapAssertionTtlSeconds: 60,
      issuer: 'https://identity.servir.test',
      keyId: 'test-key',
      privateJwk: await exportJWK(pair.privateKey),
      sessionAudience: 'servir-bff',
      sessionTtlSeconds: 28_800,
    });
    const app = await createApplication(config, {
      googleAuthentication: {
        callbackUrl: new URL('https://servir.test/bff/auth/google/callback'),
        cookieCodec,
        credentialIssuer,
        oidcProvider,
        provisioningClient: { provision: async () => ({ userId: 'user-id' }) },
        sessionTtlSeconds: 28_800,
      },
      logger: false,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/bff/auth/google/login?returnPath=https://attacker.test',
    });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toContain('https://accounts.google.test/authorize?state=');
    expect(receivedTransaction?.returnPath).toBe('/');
    const cookie = response.headers['set-cookie'];
    expect(cookie).toContain('__Host-servir-oidc-login=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');

    const loginCookie = (Array.isArray(cookie) ? cookie[0] : cookie)?.split(';', 1)[0];
    const callback = await app.inject({
      method: 'GET',
      url: '/bff/auth/google/callback?code=provider-code&state=provider-state',
      headers: { cookie: loginCookie ?? '' },
    });
    expect(callback.statusCode).toBe(302);
    expect(callback.headers.location).toBe('/');
    expect(callback.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('__Host-servir-session=')]),
    );
    const callbackCookies = callback.headers['set-cookie'];
    const cookieHeader = (Array.isArray(callbackCookies) ? callbackCookies : [callbackCookies])
      .filter((value): value is string => typeof value === 'string')
      .filter(
        (value) =>
          value.startsWith('__Host-servir-session=') || value.startsWith('__Host-servir-csrf='),
      )
      .map((value) => value.split(';', 1)[0])
      .join('; ');
    const csrfToken = /__Host-servir-csrf=([^;]+)/.exec(cookieHeader)?.[1];

    const session = await app.inject({
      method: 'GET',
      url: '/bff/auth/session',
      headers: { cookie: cookieHeader },
    });
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'organization-id' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetch);
    const organization = await app.inject({
      method: 'GET',
      url: '/bff/organizations/organization-id',
      headers: { cookie: cookieHeader },
    });
    const anonymous = await app.inject({
      method: 'GET',
      url: '/bff/organizations/organization-id',
    });
    const mutationWithoutCsrf = await app.inject({
      method: 'POST',
      url: '/bff/organizations',
      headers: { cookie: cookieHeader },
      payload: { name: 'Comunidade Servir' },
    });
    const rejectedLogout = await app.inject({
      method: 'POST',
      url: '/bff/auth/logout',
      headers: { cookie: cookieHeader, origin: 'https://attacker.test', 'x-csrf-token': csrfToken },
    });
    const logout = await app.inject({
      method: 'POST',
      url: '/bff/auth/logout',
      headers: {
        cookie: cookieHeader,
        origin: 'https://servir.test',
        'sec-fetch-site': 'same-origin',
        'x-csrf-token': csrfToken,
      },
    });
    await app.close();

    expect(session.statusCode).toBe(200);
    expect(session.json()).toEqual({ authenticated: true, userId: 'user-id' });
    expect(rejectedLogout.statusCode).toBe(403);
    expect(logout.statusCode).toBe(204);
    expect(organization.statusCode).toBe(200);
    expect(anonymous.statusCode).toBe(401);
    expect(mutationWithoutCsrf.statusCode).toBe(403);
    const authorization = new Headers(fetch.mock.calls[0]?.[1]?.headers).get('authorization');
    expect(authorization).toMatch(/^Bearer /);
    const accessToken = authorization?.slice('Bearer '.length) ?? '';
    const verifiedAccess = await jwtVerify(accessToken, pair.publicKey, {
      audience: 'servir-api',
      issuer: 'https://identity.servir.test',
    });
    expect(verifiedAccess.payload).toMatchObject({ purpose: 'access', sub: 'user-id' });
  });

  it('exposes liveness with defensive browser headers', async () => {
    const app = await createApplication(config, { logger: false });
    const response = await app.inject({ method: 'GET', url: '/health/live' });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['cache-control']).toBe('no-cache');
  });

  it('does not turn an unknown bff operation into a spa document', async () => {
    const app = await createApplication(config, { logger: false });
    const response = await app.inject({ method: 'GET', url: '/bff/unknown' });
    await app.close();

    expect(response.statusCode).toBe(404);
    expect(response.headers['content-type']).toContain('application/problem+json');
  });

  it('forwards only the organization creation contract to the private api', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'organization-id', name: 'Comunidade Servir' }), {
        status: 201,
        headers: { 'content-type': 'application/json', 'x-correlation-id': 'correlation-123' },
      }),
    );
    vi.stubGlobal('fetch', fetch);
    const app = await createApplication(config, { logger: false });

    const response = await app.inject({
      method: 'POST',
      url: '/bff/organizations',
      headers: { 'accept-language': 'pt-BR' },
      payload: { name: 'Comunidade Servir' },
    });
    await app.close();

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0]?.[0].toString()).toBe('http://private-api:3000/organizations');
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' });
    expect(response.statusCode).toBe(201);
    expect(response.headers['x-correlation-id']).toBe('correlation-123');
  });

  it('forwards the accessible organization collection to the private api', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetch);
    const app = await createApplication(config, { logger: false });

    const response = await app.inject({ method: 'GET', url: '/bff/organizations' });
    await app.close();

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0]?.[0].toString()).toBe('http://private-api:3000/organizations');
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({ method: 'GET' });
    expect(response.statusCode).toBe(200);
  });

  it('returns a safe problem when the private api is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('private address')));
    const app = await createApplication(config, { logger: false });

    const response = await app.inject({ method: 'GET', url: '/bff/organizations/id' });
    await app.close();

    expect(response.statusCode).toBe(502);
    expect(response.json()).toEqual({
      type: '/problems/upstream-unavailable',
      title: 'O serviço está temporariamente indisponível.',
      status: 502,
    });
  });

  it('forwards the ministry list filters explicitly', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ items: [], pagination: { totalItems: 0 } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetch);
    const app = await createApplication(config, { logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/bff/organizations/organization-id/ministries?page=2&pageSize=10&search=M%C3%BAsica&status=active&ignored=value',
    });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(fetch.mock.calls[0]?.[0].toString()).toBe(
      'http://private-api:3000/organizations/organization-id/ministries?page=2&pageSize=10&search=M%C3%BAsica&status=active',
    );
  });

  it('forwards ministry creation without exposing another api operation', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'ministry-id', name: 'Música', status: 'active' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetch);
    const app = await createApplication(config, { logger: false });

    const response = await app.inject({
      method: 'POST',
      url: '/bff/organizations/organization-id/ministries',
      payload: { name: 'Música' },
    });
    await app.close();

    expect(response.statusCode).toBe(201);
    expect(fetch.mock.calls[0]?.[0].toString()).toBe(
      'http://private-api:3000/organizations/organization-id/ministries',
    );
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' });
  });

  it('forwards tenant-scoped ministry details explicitly', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'ministry-id', name: 'Música', roles: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetch);
    const app = await createApplication(config, { logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/bff/organizations/organization-id/ministries/ministry-id',
    });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(fetch.mock.calls[0]?.[0].toString()).toBe(
      'http://private-api:3000/organizations/organization-id/ministries/ministry-id',
    );
  });

  it('forwards ministry role definition through an explicit BFF contract', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'role-id', name: 'Guitarra', status: 'active' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetch);
    const app = await createApplication(config, { logger: false });

    const response = await app.inject({
      method: 'POST',
      url: '/bff/organizations/organization-id/ministries/ministry-id/roles',
      payload: { name: 'Guitarra' },
    });
    await app.close();

    expect(response.statusCode).toBe(201);
    expect(fetch.mock.calls[0]?.[0].toString()).toBe(
      'http://private-api:3000/organizations/organization-id/ministries/ministry-id/roles',
    );
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' });
  });

  it('forwards only supported member list filters', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ items: [], pagination: { totalItems: 0 } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetch);
    const app = await createApplication(config, { logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/bff/organizations/organization-id/members?page=2&pageSize=20&search=Maria&status=active&ignored=value',
    });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(fetch.mock.calls[0]?.[0].toString()).toBe(
      'http://private-api:3000/organizations/organization-id/members?page=2&pageSize=20&search=Maria&status=active',
    );
  });

  it('forwards member registration and details explicitly', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'member-id', name: 'Maria' }), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'member-id', name: 'Maria', status: 'active' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    vi.stubGlobal('fetch', fetch);
    const app = await createApplication(config, { logger: false });

    const registration = await app.inject({
      method: 'POST',
      url: '/bff/organizations/organization-id/members',
      payload: { name: 'Maria' },
    });
    const details = await app.inject({
      method: 'GET',
      url: '/bff/organizations/organization-id/members/member-id',
    });
    await app.close();

    expect(registration.statusCode).toBe(201);
    expect(details.statusCode).toBe(200);
    expect(fetch.mock.calls[0]?.[0].toString()).toBe(
      'http://private-api:3000/organizations/organization-id/members',
    );
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' });
    expect(fetch.mock.calls[1]?.[0].toString()).toBe(
      'http://private-api:3000/organizations/organization-id/members/member-id',
    );
  });

  it('forwards activity listing, creation and details explicitly', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify({ items: [], pagination: { totalItems: 0 } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetch);
    const app = await createApplication(config, { logger: false });

    await app.inject({
      method: 'GET',
      url: '/bff/organizations/organization-id/activities?page=2&search=Culto&status=active&ignored=yes',
    });
    await app.inject({
      method: 'POST',
      url: '/bff/organizations/organization-id/activities',
      payload: { name: 'Culto', ministryIds: ['ministry-id'] },
    });
    await app.inject({
      method: 'GET',
      url: '/bff/organizations/organization-id/activities/activity-id',
    });
    await app.close();

    expect(fetch.mock.calls[0]?.[0].toString()).toBe(
      'http://private-api:3000/organizations/organization-id/activities?page=2&search=Culto&status=active',
    );
    expect(fetch.mock.calls[1]?.[0].toString()).toBe(
      'http://private-api:3000/organizations/organization-id/activities',
    );
    expect(fetch.mock.calls[1]?.[1]).toMatchObject({ method: 'POST' });
    expect(fetch.mock.calls[2]?.[0].toString()).toBe(
      'http://private-api:3000/organizations/organization-id/activities/activity-id',
    );
  });
});
