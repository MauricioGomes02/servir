import type { ExecutionContext } from '@/shared/application/context';
import type { NotificationError } from '@/shared/domain/notification';
import { createValidationProblemDetails } from '@/shared/infrastructure/http/problem-details';
import type { PresentedHttpProblem } from '@/shared/infrastructure/http/problem-details';
import {
  presentErrorGroup,
  type MessageTranslator,
  type PresentedError,
  type SupportedLocale,
} from '@/shared/presentation';
import type { FastifyReply } from 'fastify';

export interface SendPresentedProblemInput {
  readonly context: ExecutionContext;
  readonly error: PresentedError;
  readonly errors?: readonly PresentedError[];
  readonly locale: SupportedLocale;
  readonly problem: PresentedHttpProblem;
  readonly translator: MessageTranslator;
}

export interface SendExpectedProblemInput {
  readonly context: ExecutionContext;
  readonly error: NotificationError & { readonly errors?: readonly NotificationError[] };
  readonly locale: SupportedLocale;
  readonly problem: PresentedHttpProblem;
  readonly translator: MessageTranslator;
}

export function sendPresentedProblem(
  reply: FastifyReply,
  input: SendPresentedProblemInput,
): FastifyReply {
  const response = reply
    .status(input.problem.status)
    .type('application/problem+json')
    .header('content-language', input.locale);

  if (input.problem.status === 401) response.header('www-authenticate', 'Bearer');

  return response.send(
    createValidationProblemDetails({
      type: input.problem.type,
      title: input.translator.translate({
        code: input.problem.titleCode,
        locale: input.locale,
      }),
      status: input.problem.status,
      correlationId: input.context.correlationId,
      requestId: input.context.requestId,
      errors: input.errors ?? [input.error],
    }),
  );
}

export function sendExpectedProblem(
  reply: FastifyReply,
  input: SendExpectedProblemInput,
): FastifyReply {
  const presented = presentErrorGroup(input.error, input.context, input.locale, input.translator);

  return sendPresentedProblem(reply, {
    ...input,
    error: presented.error,
    errors: presented.errors,
  });
}
