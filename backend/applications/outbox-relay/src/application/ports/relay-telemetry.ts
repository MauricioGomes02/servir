import type { ClaimedOutboxMessage } from './outbox-message-store';

export type RelayTraceAttribute = string | number | boolean;

export interface RelayTelemetry {
  traceBatch<T>(operation: () => Promise<T>, completed?: (result: T) => void): Promise<T>;
  traceMessage<T>(message: ClaimedOutboxMessage, operation: () => Promise<T>): Promise<T>;
  addEvent(name: string, attributes?: Readonly<Record<string, RelayTraceAttribute>>): void;
  setAttributes(attributes: Readonly<Record<string, RelayTraceAttribute>>): void;
}
