import type { FastifyReply, FastifyRequest } from 'fastify';
import { resolveBffLocale, translateBffMessage, type BffMessageKey } from './localization.js';

interface SendBffProblemInput {
  readonly code: string;
  readonly messageKey: BffMessageKey;
  readonly status: number;
  readonly type: string;
}

export function sendBffProblem(
  request: FastifyRequest,
  reply: FastifyReply,
  input: SendBffProblemInput,
): FastifyReply {
  const locale = resolveBffLocale(request);
  const detail = translateBffMessage(request, input.messageKey);
  return reply
    .status(input.status)
    .header('content-language', locale)
    .type('application/problem+json')
    .send({
      type: input.type,
      title: detail,
      status: input.status,
      errors: [{ code: input.code, detail }],
    });
}
