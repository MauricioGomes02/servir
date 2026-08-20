import {
  parseCorrelationId,
  parseRequestId,
  type ExecutionContext,
} from '@/shared/application/context';
import {
  createLogRecord,
  LogLevels,
  type LogAttributes,
  type Logger,
} from '@/shared/application/logging';
import { createErrorLogAttributes } from '@servir/node-observability';
import type { FastifyReply, FastifyRequest } from 'fastify';

export const HttpUnexpectedErrorCode = 'http.request.unexpected_failure';

export type MonotonicNow = () => number;

function systemMonotonicNow(): number {
  return performance.now();
}

function fallbackContext(requestId: string): ExecutionContext | undefined {
  const correlationId = parseCorrelationId(requestId);
  const parsedRequestId = parseRequestId(requestId);

  if (!correlationId.success) {
    return undefined;
  }

  return {
    correlationId: correlationId.value,
    requestId: parsedRequestId.success ? parsedRequestId.value : undefined,
  };
}

export class FastifyRequestLogger {
  private readonly failures = new WeakMap<FastifyRequest, LogAttributes>();
  private readonly startedAt = new WeakMap<FastifyRequest, number>();

  constructor(
    private readonly logger: Logger,
    private readonly monotonicNow: MonotonicNow = systemMonotonicNow,
  ) {}

  start(request: FastifyRequest): void {
    this.startedAt.set(request, this.monotonicNow());
  }

  context(request: FastifyRequest): ExecutionContext | undefined {
    return request.executionContext ?? fallbackContext(request.id);
  }

  markFailed(request: FastifyRequest, error: unknown): void {
    this.failures.set(
      request,
      createErrorLogAttributes(error, { fallbackCode: HttpUnexpectedErrorCode }),
    );
  }

  finish(request: FastifyRequest, reply: FastifyReply): void {
    const failure = this.failures.get(request);
    const failed = reply.statusCode >= 500;

    this.log(
      request,
      reply,
      failed ? LogLevels.Error : LogLevels.Info,
      failed ? 'http.request.failed' : 'http.request.completed',
      failure,
    );
  }

  private log(
    request: FastifyRequest,
    reply: FastifyReply,
    level: 'info' | 'error',
    eventName: string,
    attributes: LogAttributes | undefined,
  ): void {
    const startedAt = this.startedAt.get(request);
    const duration = startedAt === undefined ? 0 : Math.max(0, this.monotonicNow() - startedAt);

    this.logger.log(
      createLogRecord({
        level,
        eventName,
        context: this.context(request),
        attributes: {
          'http.request.method': request.method,
          'http.route': request.routeOptions.url ?? 'unmatched',
          'http.response.status_code': reply.statusCode,
          'duration.ms': Number(duration.toFixed(3)),
          ...attributes,
        },
      }),
    );
  }
}
