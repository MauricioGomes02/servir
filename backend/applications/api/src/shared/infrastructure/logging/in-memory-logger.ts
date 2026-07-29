import {
  createLogRecord,
  type Logger,
  type LogRecord,
} from '@/shared/application/logging';

export class InMemoryLogger implements Logger {
  private readonly storedRecords: LogRecord[] = [];

  log(record: LogRecord): void {
    this.storedRecords.push(
      createLogRecord(record),
    );
  }

  get records(): ReadonlyArray<LogRecord> {
    return Object.freeze([
      ...this.storedRecords,
    ]);
  }
}
