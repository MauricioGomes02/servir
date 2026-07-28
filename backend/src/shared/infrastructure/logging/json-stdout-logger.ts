import type {
  Logger,
  LogAttributeValue,
  LogRecord,
} from '@/shared/application/logging';

const MAX_DEPTH = 8;
const MAX_ENTRIES = 100;
const MAX_STRING_LENGTH = 8_192;
const TRUNCATED_SUFFIX = '...[truncated]';

export type LogLineWriter = (line: string) => void;

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
  constructor(private readonly writer: LogLineWriter = stdoutWriter) {}

  log(record: LogRecord): void {
    try {
      const attributes = Object.fromEntries(
        Object.entries(record.attributes).map(
          ([key, value]) => [key, limitValue(value)],
        ),
      );

      this.writer(`${JSON.stringify({
        ...record,
        attributes,
      })}\n`);
    } catch {
      // Logging is best effort and must not replace the original failure.
    }
  }
}
