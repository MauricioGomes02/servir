import type { Instant } from '@/shared/domain/instant';

import type { DomainEventId } from './domain-event-metadata';

export type DomainEventScalar =
  | string
  | number
  | boolean
  | null;

export type DomainEventValue =
  | DomainEventScalar
  | ReadonlyArray<DomainEventValue>
  | { readonly [key: string]: DomainEventValue };

export type DomainEventPayload = Readonly<
  Record<string, DomainEventValue>
>;

export interface DomainEvent<
  TName extends string = string,
  TPayload extends DomainEventPayload = DomainEventPayload,
> {
  readonly eventId: DomainEventId;
  readonly name: TName;
  readonly occurredAt: Instant;
  readonly payload: TPayload;
}

function freezeValue<TValue extends DomainEventValue>(
  value: TValue,
): TValue {
  if (Array.isArray(value)) {
    return Object.freeze(
      value.map((item) => freezeValue(item)),
    ) as TValue;
  }

  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value).map(
      ([key, item]) => [key, freezeValue(item)],
    );

    return Object.freeze(
      Object.fromEntries(entries),
    ) as TValue;
  }

  return value;
}

export function createDomainEvent<
  const TName extends string,
  const TPayload extends DomainEventPayload,
>(
  event: DomainEvent<TName, TPayload>,
): DomainEvent<TName, TPayload> {
  return Object.freeze({
    ...event,
    payload: freezeValue(event.payload),
  });
}
