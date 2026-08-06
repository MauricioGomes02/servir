import type { MinistryRepository } from '../../application';
import { MinistryCreationPolicy, type Ministry } from '../../domain';
import { failure, success } from '@/shared/core/result';

export class InMemoryMinistryRepository implements MinistryRepository {
  private readonly storedMinistries: Ministry[] = [];

  async save(ministry: Ministry) {
    const conflict = this.storedMinistries.some((candidate) =>
      candidate.organizationId.equals(ministry.organizationId)
      && candidate.status === 'active'
      && candidate.name.toString().toLowerCase()
        === ministry.name.toString().toLowerCase());
    if (conflict) return failure(new MinistryCreationPolicy().activeNameConflict());
    this.storedMinistries.push(ministry);
    return success();
  }

  get ministries(): ReadonlyArray<Ministry> { return Object.freeze([...this.storedMinistries]); }
}
