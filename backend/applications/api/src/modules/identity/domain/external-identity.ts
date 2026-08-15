import { failure, success, type Result } from '@/shared/core/result';
import { Notification } from '@/shared/domain/notification';

export const ExternalIdentityErrorCodes = {
  Empty: 'identity.external_identity.empty',
  InvalidType: 'identity.external_identity.invalid_type',
  TooLong: 'identity.external_identity.too_long',
} as const;

export interface ExternalIdentityError {
  readonly code: (typeof ExternalIdentityErrorCodes)[keyof typeof ExternalIdentityErrorCodes];
  readonly field: 'issuer' | 'subject';
  readonly params?: Readonly<Record<string, number>>;
}

export interface ExternalIdentityValidationError extends ExternalIdentityError {
  readonly errors: readonly [ExternalIdentityError, ...ExternalIdentityError[]];
}

function validateValue(
  input: unknown,
  field: ExternalIdentityError['field'],
  maxLength: number,
): Result<string, ExternalIdentityError> {
  if (typeof input !== 'string') {
    return failure({ code: ExternalIdentityErrorCodes.InvalidType, field });
  }
  if (input.length === 0) return failure({ code: ExternalIdentityErrorCodes.Empty, field });
  if (input.length > maxLength) {
    return failure({
      code: ExternalIdentityErrorCodes.TooLong,
      field,
      params: { maxLength, actualLength: input.length },
    });
  }
  return success(input);
}

export class ExternalIdentity {
  private constructor(
    readonly issuer: string,
    readonly subject: string,
  ) {
    Object.freeze(this);
  }

  static create(input: {
    readonly issuer: unknown;
    readonly subject: unknown;
  }): Result<ExternalIdentity, ExternalIdentityValidationError> {
    const issuer = validateValue(input.issuer, 'issuer', 255);
    const subject = validateValue(input.subject, 'subject', 255);
    const notification = new Notification();
    if (!issuer.success) notification.add(issuer.error);
    if (!subject.success) notification.add(subject.error);

    if (notification.hasErrors()) {
      const errors = notification.getErrors() as ExternalIdentityValidationError['errors'];
      const primary = errors[0];
      if (primary === undefined) throw new Error('identity.external_identity.errors_empty');
      return failure(Object.freeze({ ...primary, errors }));
    }
    if (!issuer.success || !subject.success) {
      throw new Error('identity.external_identity.validation_inconsistent');
    }

    return success(new ExternalIdentity(issuer.value, subject.value));
  }

  equals(other: ExternalIdentity): boolean {
    return this.issuer === other.issuer && this.subject === other.subject;
  }
}
