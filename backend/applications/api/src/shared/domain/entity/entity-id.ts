export abstract class EntityId<
  TBrand extends string,
> {
  declare private readonly __brand: TBrand;

  protected constructor(
    public readonly value: string,
  ) {}

  equals(
    other: EntityId<TBrand> | null | undefined,
  ): boolean {
    return other?.value === this.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}
