function isPlainObject(value: object): boolean {
  const prototype: unknown = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function cloneAndFreeze(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items: unknown[] = value;
    return Object.freeze(items.map((item) => cloneAndFreeze(item)));
  }

  if (value !== null && typeof value === 'object' && isPlainObject(value)) {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      cloneAndFreeze(item),
    ]);

    return Object.freeze(Object.fromEntries(entries));
  }

  return value;
}

function haveEqualContent(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((item, index) => haveEqualContent(item, right[index]))
    );
  }

  if (
    left === null ||
    right === null ||
    typeof left !== 'object' ||
    typeof right !== 'object' ||
    Object.getPrototypeOf(left) !== Object.getPrototypeOf(right)
  ) {
    return false;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key) =>
        Object.hasOwn(right, key) &&
        haveEqualContent(
          (left as Record<string, unknown>)[key],
          (right as Record<string, unknown>)[key],
        ),
    )
  );
}

export abstract class ValueObject<TProps extends object, TBrand extends string> {
  /**
   * Impede que Value Objects diferentes, mas com propriedades
   * iguais, sejam considerados compatíveis pelo TypeScript.
   *
   * Exemplo:
   * OrganizationName não deve ser compatível com OrganizationSlug.
   */
  declare private readonly __brand: TBrand;

  protected readonly props: Readonly<TProps>;

  protected constructor(props: TProps) {
    this.props = cloneAndFreeze(props) as Readonly<TProps>;
  }

  equals(other: ValueObject<TProps, TBrand> | null | undefined): boolean {
    if (!other) {
      return false;
    }

    if (this === other) {
      return true;
    }

    return haveEqualContent(this.props, other.props);
  }
}
