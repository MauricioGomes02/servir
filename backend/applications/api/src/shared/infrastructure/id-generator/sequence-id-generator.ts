import type { IdGenerator } from '@/shared/application/id-generator';

import { IdSequenceExhaustedError } from './id-sequence-exhausted-error';

export class SequenceIdGenerator<TId>
implements IdGenerator<TId> {
  private readonly ids: ReadonlyArray<TId>;
  private nextIndex = 0;

  constructor(ids: ReadonlyArray<TId>) {
    this.ids = Object.freeze([...ids]);
  }

  generate(): TId {
    const id = this.ids[this.nextIndex];

    if (id === undefined) {
      throw new IdSequenceExhaustedError();
    }

    this.nextIndex += 1;

    return id;
  }
}
