import type {
  CorrelationId,
  RequestId,
} from '@/shared/application/context';
import type { MessageId } from '@/shared/application/messaging';
import type { Instant } from '@/shared/domain/instant';

export const LogLevels = {
  Trace: 'trace',
  Debug: 'debug',
  Info: 'info',
  Warn: 'warn',
  Error: 'error',
  Fatal: 'fatal',
} as const;

export type LogLevel =
  (typeof LogLevels)[keyof typeof LogLevels];

export type LogAttributeScalar =
  | string
  | number
  | boolean
  | null;

export type LogAttributeValue =
  | LogAttributeScalar
  | ReadonlyArray<LogAttributeValue>
  | { readonly [key: string]: LogAttributeValue };

export type LogAttributes = Readonly<
  Record<string, LogAttributeValue>
>;

export interface LogContext {
  readonly correlationId: CorrelationId;
  readonly requestId?: RequestId;
  readonly messageId?: MessageId;
  readonly causationId?: MessageId;
}

export interface LogRecord {
  readonly level: LogLevel;
  readonly eventName: string;
  readonly occurredAt?: Instant;
  readonly context?: LogContext;
  readonly attributes: LogAttributes;
}

function freezeAttributeValue<TValue extends LogAttributeValue>(
  value: TValue,
): TValue {
  if (Array.isArray(value)) {
    return Object.freeze(
      value.map((item) => freezeAttributeValue(item)),
    ) as TValue;
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value).map(
      ([key, item]) => [key, freezeAttributeValue(item)],
    );

    return Object.freeze(
      Object.fromEntries(entries),
    ) as TValue;
  }

  return value;
}

export function createLogRecord(
  record: LogRecord,
): LogRecord {
  return Object.freeze({
    ...record,
    context: record.context
      ? Object.freeze({ ...record.context })
      : undefined,
    attributes: freezeAttributeValue(record.attributes),
  });
}
