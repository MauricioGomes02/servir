import type { DomainEventId } from '@/shared/domain/domain-event';

import type { MessageId } from '.';

declare const eventId: DomainEventId;

// @ts-expect-error DomainEventId nao pode substituir MessageId.
const messageId: MessageId = eventId;

void messageId;
