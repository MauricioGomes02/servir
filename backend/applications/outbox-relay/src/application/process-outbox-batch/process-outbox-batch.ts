import {
  publicationErrorCode,
  ProcessOutboxBatchConfigError,
  ProcessOutboxBatchConfigErrorCodes,
} from '@/application/errors';
import type {
  Clock,
  IntegrationEventPublisher,
  LeaseIdGenerator,
  OutboxMessageStore,
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
}

export class ProcessOutboxBatch {
  constructor(
    private readonly dependencies: ProcessOutboxBatchDependencies,
  ) {
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
    let published = 0;
    let rescheduled = 0;
    let failed = 0;

    for (const message of messages) {
      try {
        await this.dependencies.publisher.publish(message);
      } catch (error) {
        const errorCode = publicationErrorCode(error);
        const failedAt = this.dependencies.clock.now();
        const retry = this.dependencies.retryPolicy.decide({
          attemptCount: message.attemptCount,
          failedAt,
          errorCode,
        });

        if (retry.retry) {
          await this.dependencies.messageStore.reschedule({
            messageId: message.messageId,
            leaseId: message.leaseId,
            failedAt,
            availableAt: retry.availableAt,
            errorCode,
          });
          rescheduled += 1;
          continue;
        }

        await this.dependencies.messageStore.markFailed({
          messageId: message.messageId,
          leaseId: message.leaseId,
          failedAt,
          errorCode,
        });
        failed += 1;
        continue;
      }

      await this.dependencies.messageStore.markPublished({
        messageId: message.messageId,
        leaseId: message.leaseId,
        publishedAt: this.dependencies.clock.now(),
      });
      published += 1;
    }

    return Object.freeze({
      claimed: messages.length,
      published,
      rescheduled,
      failed,
    });
  }
}
