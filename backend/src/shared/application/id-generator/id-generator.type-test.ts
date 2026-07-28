import type { IdGenerator } from '.';

declare const organizationIdBrand: unique symbol;
declare const userIdBrand: unique symbol;

type OrganizationId = string & {
  readonly [organizationIdBrand]: 'OrganizationId';
};

type UserId = string & {
  readonly [userIdBrand]: 'UserId';
};

if (false) {
  const userIdGenerator = {} as IdGenerator<UserId>;

  // @ts-expect-error geradores de identidades distintas nao sao intercambiaveis.
  const organizationIdGenerator: IdGenerator<OrganizationId> = userIdGenerator;

  void organizationIdGenerator;
}
