import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { bffMessages, resolveBffLocale } from './localization.js';

describe('BFF localization', () => {
  it('uses Brazilian Portuguese by default', async () => {
    const app = Fastify();
    app.get('/', (request) => ({
      locale: resolveBffLocale(request),
      title: bffMessages(request).upstreamUnavailable,
    }));

    const response = await app.inject({ method: 'GET', url: '/' });
    await app.close();

    expect(response.json()).toEqual({
      locale: 'pt-BR',
      title: 'O serviço está temporariamente indisponível.',
    });
  });

  it('selects English from the accepted languages', async () => {
    const app = Fastify();
    app.get('/', (request) => ({
      locale: resolveBffLocale(request),
      title: bffMessages(request).resourceNotFound,
    }));

    const response = await app.inject({
      method: 'GET',
      url: '/',
      headers: { 'accept-language': 'en-US,en;q=0.9' },
    });
    await app.close();

    expect(response.json()).toEqual({ locale: 'en-US', title: 'Resource not found.' });
  });
});
