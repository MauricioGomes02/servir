import type { FastifyRequest } from 'fastify';

export type BffLocale = 'pt-BR' | 'en-US';

export const BffMessageKeys = {
  AccessTokenIssueFailed: 'accessTokenIssueFailed',
  CallbackInvalid: 'callbackInvalid',
  CsrfInvalid: 'csrfInvalid',
  LoginTransactionRequired: 'loginTransactionRequired',
  ResourceNotFound: 'resourceNotFound',
  SessionInvalid: 'sessionInvalid',
  UpstreamUnavailable: 'upstreamUnavailable',
} as const;

export type BffMessageKey = (typeof BffMessageKeys)[keyof typeof BffMessageKeys];

const messages: Readonly<Record<BffLocale, Readonly<Record<BffMessageKey, string>>>> =
  Object.freeze({
    'pt-BR': Object.freeze({
      [BffMessageKeys.AccessTokenIssueFailed]: 'Não foi possível iniciar o acesso à API.',
      [BffMessageKeys.CallbackInvalid]: 'Não foi possível concluir a autenticação.',
      [BffMessageKeys.CsrfInvalid]: 'A verificação de segurança da solicitação falhou.',
      [BffMessageKeys.LoginTransactionRequired]: 'A tentativa de autenticação não foi encontrada.',
      [BffMessageKeys.ResourceNotFound]: 'Recurso não encontrado.',
      [BffMessageKeys.SessionInvalid]: 'Uma sessão válida é necessária.',
      [BffMessageKeys.UpstreamUnavailable]: 'O serviço está temporariamente indisponível.',
    }),
    'en-US': Object.freeze({
      [BffMessageKeys.AccessTokenIssueFailed]: 'Access to the API could not be started.',
      [BffMessageKeys.CallbackInvalid]: 'Authentication could not be completed.',
      [BffMessageKeys.CsrfInvalid]: 'The request security check failed.',
      [BffMessageKeys.LoginTransactionRequired]: 'The authentication attempt was not found.',
      [BffMessageKeys.ResourceNotFound]: 'Resource not found.',
      [BffMessageKeys.SessionInvalid]: 'A valid session is required.',
      [BffMessageKeys.UpstreamUnavailable]: 'The service is temporarily unavailable.',
    }),
  });

export function resolveBffLocale(request: FastifyRequest): BffLocale {
  const accepted = request.headers['accept-language']?.toLowerCase() ?? '';
  return accepted.includes('en') && !accepted.startsWith('pt') ? 'en-US' : 'pt-BR';
}

export function translateBffMessage(request: FastifyRequest, key: BffMessageKey): string {
  return messages[resolveBffLocale(request)][key];
}
