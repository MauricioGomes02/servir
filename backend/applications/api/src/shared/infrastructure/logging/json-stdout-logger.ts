import type {
  Logger,
  LogAttributeValue,
  LogRecord,
} from '@/shared/application/logging';
import {
  context,
  isSpanContextValid,
  trace,
} from '@opentelemetry/api';

const MAX_DEPTH = 8;
const MAX_ENTRIES = 100;
const MAX_STRING_LENGTH = 8_192;
const TRUNCATED_SUFFIX = '...[truncated]';

export type LogLineWriter = (line: string) => void;

export interface ActiveTraceContext {
  readonly spanId: string;
  readonly traceId: string;
}

export type ActiveTraceContextReader = () => ActiveTraceContext | undefined;

function readActiveTraceContext(): ActiveTraceContext | undefined {
  const spanContext = trace.getSpan(context.active())?.spanContext();

  if (spanContext === undefined || !isSpanContextValid(spanContext)) {
    return undefined;
  }

  return {
    spanId: spanContext.spanId,
    traceId: spanContext.traceId,
  };
}

function truncate(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) {
    return value;
  }

  return `${value.slice(
    0,
    MAX_STRING_LENGTH - TRUNCATED_SUFFIX.length,
  )}${TRUNCATED_SUFFIX}`;
}

function limitValue(
  value: LogAttributeValue,
  depth = 0,
): LogAttributeValue {
  if (typeof value === 'string') {
    return truncate(value);
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (depth >= MAX_DEPTH) {
    return '[depth-limited]';
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ENTRIES)
      .map((item) => limitValue(item, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value)
      .slice(0, MAX_ENTRIES)
      .map(([key, item]) => [key, limitValue(item, depth + 1)]),
  );
}

function stdoutWriter(line: string): void {
  void process.stdout.write(line);
}

export class JsonStdoutLogger implements Logger {
  constructor(
    private readonly writer: LogLineWriter = stdoutWriter,
    private readonly activeTraceContextReader: ActiveTraceContextReader
      = readActiveTraceContext,
  ) {}

  log(record: LogRecord): void {
    try {
      const attributes = Object.fromEntries(
        Object.entries(record.attributes).map(
          ([key, value]) => [key, limitValue(value)],
        ),
      );
      const activeTraceContext = this.activeTraceContextReader();

      this.writer(`${JSON.stringify({
        ...record,
        ...activeTraceContext,
        attributes,
      })}\n`);
    } catch {
      // Logging is best effort and must not replace the original failure.
    }
  }
}
