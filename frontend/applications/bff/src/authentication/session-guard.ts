import type { FastifyRequest } from 'fastify';
import { timingSafeEqual } from 'node:crypto';
import type { InternalCredentialIssuer } from './internal-credential-issuer.js';

export const SESSION_COOKIE = '__Host-servir-session';
export const CSRF_COOKIE = '__Host-servir-csrf';

export interface VerifiedSession {
  readonly csrfToken: string;
  readonly userId: string;
}

function sameToken(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.byteLength === rightBytes.byteLength && timingSafeEqual(leftBytes, rightBytes);
}

export async function verifyRequestSession(
  request: FastifyRequest,
  credentialIssuer: InternalCredentialIssuer,
): Promise<VerifiedSession> {
  const session = request.cookies[SESSION_COOKIE];
  if (session === undefined) throw new Error('session required');
  return credentialIssuer.verifySessionToken(session);
}

export function verifyMutationCsrf(
  request: FastifyRequest,
  session: VerifiedSession,
  trustedOrigin: string,
): void {
  const cookieToken = request.cookies[CSRF_COOKIE];
  const headerToken = request.headers['x-csrf-token'];
  const sameOrigin =
    request.headers.origin === trustedOrigin &&
    (request.headers['sec-fetch-site'] === undefined ||
      request.headers['sec-fetch-site'] === 'same-origin');
  if (
    !sameOrigin ||
    cookieToken === undefined ||
    typeof headerToken !== 'string' ||
    !sameToken(headerToken, cookieToken) ||
    !sameToken(headerToken, session.csrfToken)
  ) {
    throw new Error('csrf token invalid');
  }
}
