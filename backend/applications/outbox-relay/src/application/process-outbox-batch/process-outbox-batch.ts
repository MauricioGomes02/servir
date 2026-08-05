import {
  publicationFailure,
  ProcessOutboxBatchConfigError,
  ProcessOutboxBatchConfigErrorCodes,
} from '@/application/errors';
import type {
  ClaimedOutboxMessage,
  Clock,
  IntegrationEventPublisher,
  LeaseIdGenerator,
  OutboxMessageStore,
  RelayTelemetry,
  RetryPolicy,
} from '@/application/ports';

export interface ProcessOutboxBatchResult {
  readonly claimed: number;
  readonly published: number;
  readonly rescheduled: number;
  readonly failed: number;
}

export interface ProcessOutboxBatchDependencies {
  readonly clock: Clock;
  readonly leaseIdGenerator: LeaseIdGenerator;
  readonly messageStore: OutboxMessageStore;
  readonly publisher: IntegrationEventPublisher;
  readonly retryPolicy: RetryPolicy;
  readonly batchSize: number;
  readonly leaseDurationMilliseconds: number;
  readonly telemetry?: RelayTelemetry;
  readonly onBatchCompleted?: (result: ProcessOutboxBatchResult) => void;
}

const noOpTelemetry: RelayTelemetry = {
  traceBatch: async <T>(
    operation: () => Promise<T>,
    completed?: (result: T) => void,
  ) => {
    const result = await operation();
    completed?.(result);
    return result;
  },
  traceMessage: async <T>(
    _message: ClaimedOutboxMessage,
    operation: () => Promise<T>,
  ) => operation(),
  addEvent: () => undefined,
  setAttributes: () => undefined,
};

export class ProcessOutboxBatch {
  private readonly telemetry: RelayTelemetry;

  constructor(
    private readonly dependencies: ProcessOutboxBatchDependencies,
  ) {
    this.telemetry = dependencies.telemetry ?? noOpTelemetry;

    if (
      !Number.isInteger(dependencies.batchSize)
      || dependencies.batchSize <= 0
    ) {
      throw new ProcessOutboxBatchConfigError(
        ProcessOutboxBatchConfigErrorCodes.InvalidBatchSize,
      );
    }

    if (
      !Number.isInteger(dependencies.leaseDurationMilliseconds)
      || dependencies.leaseDurationMilliseconds <= 0
    ) {
      throw new ProcessOutboxBatchConfigError(
        ProcessOutboxBatchConfigErrorCodes.InvalidLeaseDuration,
      );
    }
  }

  async execute(): Promise<ProcessOutboxBatchResult> {
    const claimedAt = this.dependencies.clock.now();
    const leaseId = this.dependencies.leaseIdGenerator.generate();
    const messages = await this.dependencies.messageStore.claim({
      leaseId,
      claimedAt,
      leaseExpiresAt: this.dependencies.clock.after(
        claimedAt,
        this.dependencies.leaseDurationMilliseconds,
      ),
      limit: this.dependencies.batchSize,
    });

    if (messages.length === 0) {
      return Object.freeze({
        claimed: 0,
        published: 0,
        rescheduled: 0,
        failed: 0,
      });
    }

    return this.telemetry.traceBatch(async () => {
      const result = await this.processMessages(messages);

      this.telemetry.setAttributes({
        'servir.outbox.claimed': result.claimed,
        'servir.outbox.published': result.published,
        'servir.outbox.rescheduled': result.rescheduled,
        'servir.outbox.failed': result.failed,
        'servir.outbox.batch_size': this.dependencies.batchSize,
      });

      return result;
    }, this.dependencies.onBatchCompleted);
  }

  private async processMessages(
    messages: readonly ClaimedOutboxMessage[],
  ): Promise<ProcessOutboxBatchResult> {
    let published = 0;
    let rescheduled = 0;
    let failed = 0;

    for (const message of messages) {
      await this.telemetry.traceMessage(message, async () => {
        try {
          await this.dependencies.publisher.publish(message);
        } catch (error) {
          const failure = publicationFailure(error);
          const failedAt = this.dependencies.clock.now();
          const retry = this.dependencies.retryPolicy.decide({
            attemptCount: message.attemptCount,
            failedAt,
            errorCode: failure.code,
            retryable: failure.retryable,
          });

          if (retry.retry) {
            await this.dependencies.messageStore.reschedule({
              messageId: message.messageId,
              leaseId: message.leaseId,
              failedAt,
              availableAt: retry.availableAt,
              errorCode: failure.code,
            });
            rescheduled += 1;
            this.telemetry.addEvent('outbox.message.rescheduled', {
              'error.code': failure.code,
              'servir.outbox.attempt': message.attemptCount,
            });
            return;
          }

          await this.dependencies.messageStore.markFailed({
            messageId: message.messageId,
            leaseId: message.leaseId,
            failedAt,
            errorCode: failure.code,
          });
          failed += 1;
          this.telemetry.addEvent('outbox.message.failed', {
            'error.code': failure.code,
            'servir.outbox.attempt': message.attemptCount,
          });
          return;
        }

        await this.dependencies.messageStore.markPublished({
          messageId: message.messageId,
          leaseId: message.leaseId,
          publishedAt: this.dependencies.clock.now(),
        });
        published += 1;
        this.telemetry.addEvent('outbox.message.published', {
          'servir.outbox.attempt': message.attemptCount,
        });
      });
    }

    return Object.freeze({
      claimed: messages.length,
      published,
      rescheduled,
      failed,
    });
  }
}
