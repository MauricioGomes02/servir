import type { ExecutionContext } from '@/shared/application/context';
import { createValidationProblemDetails } from '@/shared/infrastructure/http/problem-details';
import type { MessageTranslator, PresentedError, SupportedLocale } from '@/shared/presentation';
import type { FastifyReply } from 'fastify';

export interface PresentedHttpProblem {
  readonly status: number;
  readonly type: string;
  readonly titleCode: string;
}

export interface SendPresentedProblemInput {
  readonly context: ExecutionContext;
  readonly error: PresentedError;
  readonly locale: SupportedLocale;
  readonly problem: PresentedHttpProblem;
  readonly translator: MessageTranslator;
}

export function sendPresentedProblem(
  reply: FastifyReply,
  input: SendPresentedProblemInput,
): FastifyReply {
  return reply
    .status(input.problem.status)
    .type('application/problem+json')
    .header('content-language', input.locale)
    .send(
      createValidationProblemDetails({
        type: input.problem.type,
        title: input.translator.translate({
          code: input.problem.titleCode,
          locale: input.locale,
        }),
        status: input.problem.status,
        correlationId: input.context.correlationId,
        requestId: input.context.requestId,
        errors: [input.error],
      }),
    );
}
