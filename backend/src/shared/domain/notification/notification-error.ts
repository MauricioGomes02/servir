export type NotificationErrorParam =
  | string
  | number
  | boolean
  | null;

export type NotificationErrorParams = Readonly<
  Record<string, NotificationErrorParam>
>;

export interface NotificationError<
  TCode extends string = string,
> {
  readonly code: TCode;
  readonly field?: string;
  readonly params?: NotificationErrorParams;
}
