export type JsonScalar = string | number | boolean | null;

export type JsonValue =
  JsonScalar | ReadonlyArray<JsonValue> | { readonly [key: string]: JsonValue };

export type JsonObject = Readonly<Record<string, JsonValue>>;

export interface IntegrationEvent<
  TName extends string = string,
  TVersion extends number = number,
  TPayload extends JsonObject = JsonObject,
> {
  readonly channel: string;
  readonly source: string;
  readonly type: string;
  readonly name: TName;
  readonly version: TVersion;
  readonly occurredAt: string;
  readonly aggregateId?: string;
  readonly partitionKey?: string;
  readonly payload: TPayload;
  readonly metadata: JsonObject;
}
