export type RelayLogSeverity = 'info' | 'warn' | 'error';
export type RelayLogAttribute = string | number | boolean;

export interface RelayLogRecord {
  readonly timestamp: string;
  readonly severity: RelayLogSeverity;
  readonly name: string;
  readonly traceId?: string;
  readonly spanId?: string;
  readonly attributes?: Readonly<Record<string, RelayLogAttribute>>;
}

export interface RelayLogger {
  log(record: RelayLogRecord): void;
}
