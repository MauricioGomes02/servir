import type { LogRecord } from './log-record';

export interface Logger {
  log(record: LogRecord): void;
}
