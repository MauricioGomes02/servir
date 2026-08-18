import type { FastifyReply, FastifyRequest } from 'fastify';
import type { BffConfig } from '../config.js';
import { BffProblemCodes } from './bff-problem-code.js';
import { BffMessageKeys } from './localization.js';
import { sendBffProblem } from './problem-details.js';

export type ApiForwarder = (
  request: FastifyRequest,
  reply: FastifyReply,
  path: string,
) => Promise<FastifyReply>;

export function createApiForwarder(
  config: BffConfig,
  accessTokenFor: (request: FastifyRequest) => string | undefined,
): ApiForwarder {
  return async (request, reply, path) => {
    try {
      const accessToken = accessTokenFor(request);
      const response = await fetch(new URL(path, config.apiBaseUrl), {
        method: request.method,
        headers: {
          accept: 'application/json',
          'accept-language': request.headers['accept-language'] ?? 'pt-BR',
          ...(request.headers['content-type']
            ? { 'content-type': request.headers['content-type'] }
            : {}),
          ...(accessToken === undefined ? {} : { authorization: `Bearer ${accessToken}` }),
        },
        body:
          request.method === 'GET' || request.method === 'HEAD'
            ? undefined
            : JSON.stringify(request.body),
        signal: AbortSignal.timeout(config.apiTimeoutMs),
      });
      reply.status(response.status);
      const contentType = response.headers.get('content-type');
      if (contentType) reply.header('content-type', contentType);
      const correlationId = response.headers.get('x-correlation-id');
      if (correlationId) reply.header('x-correlation-id', correlationId);
      return reply.send(await response.text());
    } catch (error) {
      request.log.error({ err: error }, 'api upstream request failed');
      return sendBffProblem(request, reply, {
        code: BffProblemCodes.UpstreamUnavailable,
        messageKey: BffMessageKeys.UpstreamUnavailable,
        status: 502,
        type: '/problems/upstream-unavailable',
      });
    }
  };
}

export function supportedQuerySuffix<TQuery extends object>(
  query: TQuery,
  names: readonly (keyof TQuery & string)[],
): string {
  const parameters = new URLSearchParams();
  for (const name of names) {
    const value = query[name] as string | undefined;
    if (value !== undefined) parameters.set(name, value);
  }
  return parameters.size === 0 ? '' : `?${parameters.toString()}`;
}
