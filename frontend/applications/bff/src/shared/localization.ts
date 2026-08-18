import type { FastifyRequest } from 'fastify';

export type BffLocale = 'pt-BR' | 'en-US';

const messages = Object.freeze({
  'pt-BR': Object.freeze({
    upstreamUnavailable: 'O serviço está temporariamente indisponível.',
    resourceNotFound: 'Recurso não encontrado.',
  }),
  'en-US': Object.freeze({
    upstreamUnavailable: 'The service is temporarily unavailable.',
    resourceNotFound: 'Resource not found.',
  }),
});

export function resolveBffLocale(request: FastifyRequest): BffLocale {
  const accepted = request.headers['accept-language']?.toLowerCase() ?? '';
  return accepted.includes('en') && !accepted.startsWith('pt') ? 'en-US' : 'pt-BR';
}

export function bffMessages(request: FastifyRequest) {
  return messages[resolveBffLocale(request)];
}
