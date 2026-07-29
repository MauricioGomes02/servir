export type RetryDecision = Readonly<
  | { retry: true; availableAt: string }
  | { retry: false }
>;

export interface RetryPolicy {
  decide(input: Readonly<{
    attemptCount: number;
    failedAt: string;
    errorCode: string;
    retryable: boolean;
  }>): RetryDecision;
}
