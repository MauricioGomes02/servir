const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

declare const leaseIdBrand: unique symbol;

export type LeaseId = string & { readonly [leaseIdBrand]: 'LeaseId' };

export const LeaseIdErrorCodes = {
  Invalid: 'lease_id.invalid',
} as const;

export class LeaseIdError extends Error {
  override readonly name = 'LeaseIdError';

  constructor(
    readonly code: (typeof LeaseIdErrorCodes)[keyof typeof LeaseIdErrorCodes],
    options?: ErrorOptions,
  ) {
    super(code, options);
  }
}

export function createLeaseId(input: unknown): LeaseId {
  if (typeof input !== 'string' || !UUID_V7_PATTERN.test(input)) {
    throw new LeaseIdError(LeaseIdErrorCodes.Invalid);
  }

  return input as LeaseId;
}
