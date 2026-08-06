import type { Result } from '@/shared/core/result';
import type { Ministry, MinistryActiveNameConflictError } from '../../../domain';

export interface MinistryRepository {
  save(ministry: Ministry): Promise<Result<void, MinistryActiveNameConflictError>>;
}
