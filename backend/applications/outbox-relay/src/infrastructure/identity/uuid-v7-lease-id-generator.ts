import { createLeaseId, type LeaseId, type LeaseIdGenerator } from '@/application';
import { v7 } from 'uuid';

export const LeaseIdGenerationErrorCode = 'lease_id.generation_failed' as const;

export class LeaseIdGenerationError extends Error {
  override readonly name = 'LeaseIdGenerationError';

  constructor(options?: ErrorOptions) {
    super(LeaseIdGenerationErrorCode, options);
  }
}

export class UuidV7LeaseIdGenerator implements LeaseIdGenerator {
  constructor(private readonly source: () => string = v7) {}

  generate(): LeaseId {
    try {
      return createLeaseId(this.source());
    } catch (cause) {
      throw new LeaseIdGenerationError({ cause });
    }
  }
}
