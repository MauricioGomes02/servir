import type { JsonObject } from '@servir/integration-messaging';

import type { ClaimedOutboxMessage } from '@/application';

export interface StructuredCloudEvent {
  readonly specversion: '1.0';
  readonly id: string;
  readonly source: string;
  readonly type: string;
  readonly subject?: string;
  readonly time: string;
  readonly datacontenttype: 'application/json';
  readonly correlationid: string;
  readonly causationid?: string;
  readonly data: JsonObject;
}

export interface CloudEventMapping {
  readonly source: string;
  readonly typePrefix: string;
}

export function mapToStructuredCloudEvent(
  message: ClaimedOutboxMessage,
  mapping: CloudEventMapping,
): StructuredCloudEvent {
  return Object.freeze({
    specversion: '1.0',
    id: message.messageId,
    source: mapping.source,
    type: `${mapping.typePrefix}.${message.event.name}.v${message.event.version}`,
    subject: message.event.aggregateId,
    time: message.event.occurredAt,
    datacontenttype: 'application/json',
    correlationid: message.correlationId,
    causationid: message.causationId,
    data: message.event.payload,
  });
}
