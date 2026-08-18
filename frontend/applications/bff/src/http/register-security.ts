import type { FastifyInstance } from 'fastify';

export function registerSecurityHeaders(app: FastifyInstance): void {
  app.addHook('onSend', async (request, reply, payload) => {
    reply.header('x-content-type-options', 'nosniff');
    reply.header('referrer-policy', 'strict-origin-when-cross-origin');
    reply.header('x-frame-options', 'DENY');
    reply.header(
      'content-security-policy',
      "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; object-src 'none'",
    );
    if (request.url.startsWith('/assets/')) {
      reply.header('cache-control', 'public, max-age=31536000, immutable');
    } else if (!request.url.startsWith('/bff/')) {
      reply.header('cache-control', 'no-cache');
    }
    return payload;
  });
}
