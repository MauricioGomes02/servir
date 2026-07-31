import type { RelayLogger, RelayLogRecord } from './relay-logger';

export class JsonStdoutRelayLogger implements RelayLogger {
  constructor(
    private readonly write: (line: string) => void = (line) => {
      process.stdout.write(`${line}\n`);
    },
  ) {}

  log(record: RelayLogRecord): void {
    try {
      this.write(JSON.stringify(record));
    } catch {
      // Logging is best effort and must not change relay behavior.
    }
  }
}
