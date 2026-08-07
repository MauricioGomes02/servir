import type { UnitOfWork } from '@/shared/application/unit-of-work';

export class DirectUnitOfWork<TScope extends object> implements UnitOfWork<TScope> {
  constructor(private readonly scope: TScope) {}

  execute<TResult>(work: (scope: TScope) => Promise<TResult>): Promise<TResult> {
    return Promise.resolve().then(() => work(this.scope));
  }
}
