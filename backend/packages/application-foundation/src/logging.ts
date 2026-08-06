export const LogLevels = {
  Trace: 'trace',
  Debug: 'debug',
  Info: 'info',
  Warn: 'warn',
  Error: 'error',
  Fatal: 'fatal',
} as const;

export type LogLevel = (typeof LogLevels)[keyof typeof LogLevels];

export type LogAttributeScalar = string | number | boolean | null;
export type LogAttributeValue = LogAttributeScalar
  | ReadonlyArray<LogAttributeValue>
  | { readonly [key: string]: LogAttributeValue };
export type LogAttributes = Readonly<Record<string, LogAttributeValue>>;

export interface LogContext {
  readonly correlationId: string;
  readonly requestId?: string;
  readonly messageId?: string;
  readonly causationId?: string;
}

export interface LogRecord {
  readonly level: LogLevel;
  readonly eventName: string;
  readonly occurredAt?: string;
  readonly context?: LogContext;
  readonly attributes: LogAttributes;
}

export interface Logger {
  log(record: LogRecord): void;
}

export function parseLogLevel(
  input: unknown,
  fallback: LogLevel = LogLevels.Info,
): LogLevel | undefined {
  if (input === undefined) {
    return fallback;
  }

  if (typeof input !== 'string') {
    return undefined;
  }

  const normalized = input.trim().toLowerCase();

  return (Object.values(LogLevels) as string[]).includes(normalized)
    ? normalized as LogLevel
    : undefined;
}

function freezeAttributeValue<TValue extends LogAttributeValue>(value: TValue): TValue {
  if (Array.isArray(value)) {
    return Object.freeze(value.map((item) => freezeAttributeValue(item))) as TValue;
  }

  if (value !== null && typeof value === 'object') {
    return Object.freeze(Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, freezeAttributeValue(item)]),
    )) as TValue;
  }

  return value;
}

export function createLogRecord(record: LogRecord): LogRecord {
  return Object.freeze({
    ...record,
    context: record.context === undefined
      ? undefined
      : Object.freeze({ ...record.context }),
    attributes: freezeAttributeValue(record.attributes),
  });
}
