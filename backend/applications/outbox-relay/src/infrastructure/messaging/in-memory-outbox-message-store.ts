import type { IntegrationEvent } from '@servir/integration-messaging';

import type {
  ClaimedOutboxMessage,
  ClaimOutboxMessages,
  LeaseId,
  OutboxMessageStore,
} from '@/application';
import {
  OutboxLeaseError,
  OutboxLeaseErrorCodes,
} from '@/application';

export interface InMemoryOutboxMessage {
  readonly messageId: string;
  readonly eventId: string;
  readonly correlationId: string;
  readonly causationId?: string;
  readonly event: IntegrationEvent;
  readonly availableAt: string;
  readonly attemptCount?: number;
}

interface StoredOutboxMessage
extends Omit<InMemoryOutboxMessage, 'availableAt' | 'attemptCount'> {
  availableAt: string;
  attemptCount: number;
  leaseId?: LeaseId;
  leaseExpiresAt?: string;
  publishedAt?: string;
  failedAt?: string;
  lastErrorCode?: string;
}

export interface OutboxMessageSnapshot extends InMemoryOutboxMessage {
  readonly attemptCount: number;
  readonly leaseId?: LeaseId;
  readonly leaseExpiresAt?: string;
  readonly publishedAt?: string;
  readonly failedAt?: string;
  readonly lastErrorCode?: string;
}

function snapshot(message: StoredOutboxMessage): OutboxMessageSnapshot {
  return Object.freeze({ ...message });
}

export class InMemoryOutboxMessageStore implements OutboxMessageStore {
  private readonly messages: StoredOutboxMessage[];

  constructor(messages: readonly InMemoryOutboxMessage[]) {
    this.messages = messages.map((message) => ({
      ...message,
      attemptCount: message.attemptCount ?? 0,
    }));
  }

  get currentMessages(): readonly OutboxMessageSnapshot[] {
    return Object.freeze(this.messages.map(snapshot));
  }

  async claim(
    input: ClaimOutboxMessages,
  ): Promise<readonly ClaimedOutboxMessage[]> {
    const claimed: ClaimedOutboxMessage[] = [];

    for (const message of this.messages) {
      if (claimed.length >= input.limit) {
        break;
      }

      const unavailable = message.availableAt > input.claimedAt;
      const terminal = message.publishedAt !== undefined
        || message.failedAt !== undefined;
      const activelyLeased = message.leaseExpiresAt !== undefined
        && message.leaseExpiresAt > input.claimedAt;

      if (unavailable || terminal || activelyLeased) {
        continue;
      }

      message.leaseId = input.leaseId;
      message.leaseExpiresAt = input.leaseExpiresAt;
      message.attemptCount += 1;
      claimed.push(Object.freeze({
        messageId: message.messageId,
        eventId: message.eventId,
        correlationId: message.correlationId,
        causationId: message.causationId,
        event: message.event,
        attemptCount: message.attemptCount,
        leaseId: input.leaseId,
        leaseExpiresAt: input.leaseExpiresAt,
      }));
    }

    return Object.freeze(claimed);
  }

  async markPublished(input: Readonly<{
    messageId: string;
    leaseId: LeaseId;
    publishedAt: string;
  }>): Promise<void> {
    const message = this.requireLease(
      input.messageId,
      input.leaseId,
      input.publishedAt,
    );
    message.publishedAt = input.publishedAt;
    this.release(message);
  }

  async reschedule(input: Readonly<{
    messageId: string;
    leaseId: LeaseId;
    failedAt: string;
    availableAt: string;
    errorCode: string;
  }>): Promise<void> {
    const message = this.requireLease(
      input.messageId,
      input.leaseId,
      input.failedAt,
    );
    message.availableAt = input.availableAt;
    message.lastErrorCode = input.errorCode;
    this.release(message);
  }

  async markFailed(input: Readonly<{
    messageId: string;
    leaseId: LeaseId;
    failedAt: string;
    errorCode: string;
  }>): Promise<void> {
    const message = this.requireLease(
      input.messageId,
      input.leaseId,
      input.failedAt,
    );
    message.failedAt = input.failedAt;
    message.lastErrorCode = input.errorCode;
    this.release(message);
  }

  private requireLease(
    messageId: string,
    leaseId: LeaseId,
    transitionAt: string,
  ): StoredOutboxMessage {
    const message = this.messages.find(
      (candidate) => candidate.messageId === messageId,
    );

    if (message?.leaseId !== leaseId || message.leaseExpiresAt === undefined) {
      throw new OutboxLeaseError(OutboxLeaseErrorCodes.NotOwned);
    }

    if (message.leaseExpiresAt <= transitionAt) {
      throw new OutboxLeaseError(OutboxLeaseErrorCodes.Expired);
    }

    return message;
  }

  private release(message: StoredOutboxMessage): void {
    delete message.leaseId;
    delete message.leaseExpiresAt;
  }
}
