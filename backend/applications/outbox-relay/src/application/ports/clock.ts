export interface Clock {
  now(): string;
  after(instant: string, milliseconds: number): string;
}
