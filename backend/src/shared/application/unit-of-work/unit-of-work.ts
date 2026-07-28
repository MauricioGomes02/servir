export interface UnitOfWork<TScope extends object> {
  execute<TResult>(
    work: (scope: TScope) => Promise<TResult>,
  ): Promise<TResult>;
}
