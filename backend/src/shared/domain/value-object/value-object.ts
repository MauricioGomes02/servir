import { isDeepStrictEqual } from 'node:util';

export abstract class ValueObject<
  TProps extends object,
  TBrand extends string,
> {
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
    this.props = Object.freeze({
      ...props,
    }) as Readonly<TProps>;
  }

  equals(
    other:
      | ValueObject<TProps, TBrand>
      | null
      | undefined,
  ): boolean {
    if (!other) {
      return false;
    }

    if (this === other) {
      return true;
    }

    return isDeepStrictEqual(
      this.props,
      other.props,
    );
  }
}