import type { ProcessOutboxBatchResult } from '@/application';
import type { Clock } from '@/application';
import {
  createLogRecord,
  LogLevels,
  type Logger,
  type LogAttributes,
  type LogLevel,
} from '@servir/application-foundation';

export interface OutboxBatchProcessor {
  execute(): Promise<ProcessOutboxBatchResult>;
}

export type RelayDelay = (milliseconds: number, signal: AbortSignal) => Promise<void>;

export interface OutboxRelayWorkerDependencies {
  readonly batchProcessor: OutboxBatchProcessor;
  readonly batchSize: number;
  readonly pollIntervalMilliseconds: number;
  readonly clock: Clock;
  readonly logger: Logger;
  readonly delay?: RelayDelay;
}

export const RelayWorkerErrorCode = 'outbox.relay.cycle_failed' as const;

export function waitForDelay(milliseconds: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      signal.removeEventListener('abort', stopWaiting);
      resolve();
    }, milliseconds);
    const stopWaiting = (): void => {
      clearTimeout(timeout);
      resolve();
    };

    signal.addEventListener('abort', stopWaiting, { once: true });
  });
}

function errorCode(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code;
  }

  return RelayWorkerErrorCode;
}

export class OutboxRelayWorker {
  private readonly delay: RelayDelay;

  constructor(private readonly dependencies: OutboxRelayWorkerDependencies) {
    this.delay = dependencies.delay ?? waitForDelay;
  }

  async run(signal: AbortSignal): Promise<void> {
    while (!signal.aborted) {
      let result: ProcessOutboxBatchResult;

      try {
        result = await this.dependencies.batchProcessor.execute();
      } catch (error) {
        this.log(LogLevels.Error, 'outbox.relay.cycle.failed', {
          'error.code': errorCode(error),
        });
        await this.delay(this.dependencies.pollIntervalMilliseconds, signal);
        continue;
      }

      if (result.claimed < this.dependencies.batchSize) {
        await this.delay(this.dependencies.pollIntervalMilliseconds, signal);
      }
    }
  }

  private log(level: LogLevel, eventName: string, attributes: LogAttributes = {}): void {
    try {
      this.dependencies.logger.log(
        createLogRecord({
          occurredAt: this.dependencies.clock.now(),
          level,
          eventName,
          attributes,
        }),
      );
    } catch {
      // Observability cannot change durable delivery behavior.
    }
  }
}
