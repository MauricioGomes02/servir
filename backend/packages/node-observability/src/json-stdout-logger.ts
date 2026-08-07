import type {
  Logger,
  LogAttributeValue,
  LogLevel,
  LogRecord,
} from '@servir/application-foundation';
import { context, isSpanContextValid, trace } from '@opentelemetry/api';

const MAX_DEPTH = 8;
const MAX_ENTRIES = 100;
const MAX_STRING_LENGTH = 8_192;
const TRUNCATED_SUFFIX = '...[truncated]';
const LOG_LEVEL_WEIGHT: Readonly<Record<LogLevel, number>> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

export type LogLineWriter = (line: string) => void;
export interface ActiveTraceContext {
  readonly spanId: string;
  readonly traceId: string;
}
export type ActiveTraceContextReader = () => ActiveTraceContext | undefined;

function readActiveTraceContext(): ActiveTraceContext | undefined {
  const spanContext = trace.getSpan(context.active())?.spanContext();
  if (spanContext === undefined || !isSpanContextValid(spanContext)) return undefined;
  return { spanId: spanContext.spanId, traceId: spanContext.traceId };
}

function limitValue(value: LogAttributeValue, depth = 0): LogAttributeValue {
  if (typeof value === 'string') {
    return value.length <= MAX_STRING_LENGTH
      ? value
      : `${value.slice(0, MAX_STRING_LENGTH - TRUNCATED_SUFFIX.length)}${TRUNCATED_SUFFIX}`;
  }
  if (value === null || typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return '[depth-limited]';
  if (Array.isArray(value)) {
    const items: ReadonlyArray<LogAttributeValue> = value;
    return items.slice(0, MAX_ENTRIES).map((item) => limitValue(item, depth + 1));
  }
  return Object.fromEntries(
    Object.entries(value as Readonly<Record<string, LogAttributeValue>>)
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
    private readonly activeTraceContextReader: ActiveTraceContextReader = readActiveTraceContext,
    private readonly minimumLevel: LogLevel = 'info',
  ) {}

  log(record: LogRecord): void {
    if (LOG_LEVEL_WEIGHT[record.level] < LOG_LEVEL_WEIGHT[this.minimumLevel]) return;
    try {
      const attributes = Object.fromEntries(
        Object.entries(record.attributes).map(([key, value]) => [key, limitValue(value)]),
      );
      this.writer(
        `${JSON.stringify({
          ...record,
          ...this.activeTraceContextReader(),
          attributes,
        })}\n`,
      );
    } catch {
      // Logging is best effort and must not replace the original failure.
    }
  }
}
