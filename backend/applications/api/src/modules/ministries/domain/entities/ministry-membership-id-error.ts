export const MinistryMembershipIdErrorCodes = {
  InvalidType: 'ministry_membership.id.invalid_type',
  Empty: 'ministry_membership.id.empty',
  InvalidFormat: 'ministry_membership.id.invalid_format',
  TooLong: 'ministry_membership.id.too_long',
} as const;

export type MinistryMembershipIdErrorCode =
  (typeof MinistryMembershipIdErrorCodes)[keyof typeof MinistryMembershipIdErrorCodes];

export interface MinistryMembershipIdError {
  readonly code: MinistryMembershipIdErrorCode;
  readonly field: 'ministryMembershipId';
  readonly parameters?: Readonly<Record<string, string | number>>;
}
