import cookie from '@fastify/cookie';
import type { FastifyInstance } from 'fastify';
import * as oidc from 'openid-client';
import type { AuthenticationCookieCodec } from './authentication-cookie-codec.js';
import type { OidcProvider } from './oidc-provider.js';

const LOGIN_TRANSACTION_COOKIE = '__Host-servir-oidc-login';

interface LoginQuery {
  readonly returnPath?: string;
}

export interface GoogleAuthenticationRouteDependencies {
  readonly cookieCodec: AuthenticationCookieCodec;
  readonly oidcProvider: OidcProvider;
}

function safeReturnPath(value: string | undefined): string {
  if (value === undefined || value === '') return '/';
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/';
  return value;
}

export async function registerGoogleAuthenticationRoutes(
  app: FastifyInstance,
  dependencies: GoogleAuthenticationRouteDependencies,
): Promise<void> {
  await app.register(cookie);

  app.get<{ Querystring: LoginQuery }>('/bff/auth/google/login', async (request, reply) => {
    const transaction = Object.freeze({
      codeVerifier: oidc.randomPKCECodeVerifier(),
      nonce: oidc.randomNonce(),
      returnPath: safeReturnPath(request.query.returnPath),
      state: oidc.randomState(),
    });
    const [authorizationUrl, encryptedTransaction] = await Promise.all([
      dependencies.oidcProvider.createAuthorizationUrl(transaction),
      dependencies.cookieCodec.encryptLoginTransaction(transaction),
    ]);

    reply.setCookie(LOGIN_TRANSACTION_COOKIE, encryptedTransaction, {
      httpOnly: true,
      maxAge: dependencies.cookieCodec.loginTransactionTtlSeconds,
      path: '/',
      sameSite: 'lax',
      secure: true,
    });
    return reply.redirect(authorizationUrl.href);
  });
}
