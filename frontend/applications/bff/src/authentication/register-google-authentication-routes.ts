import cookie from '@fastify/cookie';
import type { FastifyInstance } from 'fastify';
import * as oidc from 'openid-client';
import type { AuthenticationCookieCodec } from './authentication-cookie-codec.js';
import type { OidcProvider } from './oidc-provider.js';
import type { InternalCredentialIssuer } from './internal-credential-issuer.js';
import type { UserProvisioningClient } from './user-provisioning-client.js';
import {
  CSRF_COOKIE,
  SESSION_COOKIE,
  verifyMutationCsrf,
  verifyRequestSession,
} from './session-guard.js';

const LOGIN_TRANSACTION_COOKIE = '__Host-servir-oidc-login';

interface LoginQuery {
  readonly returnPath?: string;
}

export interface GoogleAuthenticationRouteDependencies {
  readonly cookieCodec: AuthenticationCookieCodec;
  readonly oidcProvider: OidcProvider;
  readonly credentialIssuer: InternalCredentialIssuer;
  readonly provisioningClient: UserProvisioningClient;
  readonly callbackUrl: URL;
  readonly sessionTtlSeconds: number;
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

  app.get('/bff/auth/google/callback', async (request, reply) => {
    const encryptedTransaction = request.cookies[LOGIN_TRANSACTION_COOKIE];
    reply.clearCookie(LOGIN_TRANSACTION_COOKIE, { path: '/' });
    if (encryptedTransaction === undefined) {
      return reply.status(400).send({ code: 'identity.oidc.login_transaction_required' });
    }
    try {
      const transaction =
        await dependencies.cookieCodec.decryptLoginTransaction(encryptedTransaction);
      const callbackUrl = new URL(request.raw.url ?? '', dependencies.callbackUrl);
      const identity = await dependencies.oidcProvider.verifyCallback(callbackUrl, transaction);
      const bootstrapAssertion =
        await dependencies.credentialIssuer.issueBootstrapAssertion(identity);
      const { userId } = await dependencies.provisioningClient.provision(bootstrapAssertion);
      const csrfToken = oidc.randomState();
      const session = await dependencies.credentialIssuer.issueSessionToken(userId, csrfToken);
      reply.setCookie(SESSION_COOKIE, session, {
        httpOnly: true,
        maxAge: dependencies.sessionTtlSeconds,
        path: '/',
        sameSite: 'lax',
        secure: true,
      });
      reply.setCookie(CSRF_COOKIE, csrfToken, {
        httpOnly: false,
        maxAge: dependencies.sessionTtlSeconds,
        path: '/',
        sameSite: 'strict',
        secure: true,
      });
      return reply.redirect(transaction.returnPath);
    } catch (error) {
      request.log.warn({ err: error }, 'google oidc callback rejected');
      return reply.status(401).send({ code: 'identity.oidc.callback_invalid' });
    }
  });

  app.get('/bff/auth/session', async (request, reply) => {
    const session = request.cookies[SESSION_COOKIE];
    if (session === undefined) return reply.status(401).send({ authenticated: false });
    try {
      const verified = await verifyRequestSession(request, dependencies.credentialIssuer);
      return reply.send({ authenticated: true, userId: verified.userId });
    } catch {
      return reply.status(401).send({ authenticated: false });
    }
  });

  app.post('/bff/auth/logout', async (request, reply) => {
    try {
      const verified = await verifyRequestSession(request, dependencies.credentialIssuer);
      verifyMutationCsrf(request, verified, dependencies.callbackUrl.origin);
    } catch {
      return reply.status(403).send({ code: 'identity.csrf.invalid' });
    }
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    reply.clearCookie(CSRF_COOKIE, { path: '/' });
    return reply.status(204).send();
  });
}
