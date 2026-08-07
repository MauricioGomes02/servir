import { type EntityId } from './entity-id';

export abstract class Entity<TId extends EntityId<string>, TProps extends object> {
  protected constructor(
    public readonly id: TId,
    protected props: TProps,
  ) {}

  equals(other: Entity<TId, TProps> | null | undefined): boolean {
    if (!other) {
      return false;
    }

    if (this === other) {
      return true;
    }

    return this.id.equals(other.id);
  }
}
