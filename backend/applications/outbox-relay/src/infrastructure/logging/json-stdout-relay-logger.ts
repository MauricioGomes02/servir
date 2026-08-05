import type { RelayLogger, RelayLogRecord } from './relay-logger';
import { trace, type SpanContext } from '@opentelemetry/api';

export class JsonStdoutRelayLogger implements RelayLogger {
  constructor(
    private readonly write: (line: string) => void = (line) => {
      process.stdout.write(`${line}\n`);
    },
    private readonly activeSpanContext: () => SpanContext | undefined = () =>
      trace.getActiveSpan()?.spanContext(),
  ) {}

  log(record: RelayLogRecord): void {
    try {
      const spanContext = this.activeSpanContext();
      const correlatedRecord = spanContext === undefined
        ? record
        : {
          ...record,
          traceId: spanContext.traceId,
          spanId: spanContext.spanId,
        };

      this.write(JSON.stringify(correlatedRecord));
    } catch {
      // Logging is best effort and must not change relay behavior.
    }
  }
}
