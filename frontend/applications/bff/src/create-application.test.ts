import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApplication } from './create-application.js';

const config = {
  apiBaseUrl: new URL('http://private-api:3000'),
  apiTimeoutMs: 10_000,
  host: '0.0.0.0',
  port: 3001,
};

afterEach(() => vi.unstubAllGlobals());

describe('frontend BFF', () => {
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
});
