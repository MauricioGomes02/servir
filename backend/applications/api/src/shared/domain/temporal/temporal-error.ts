export const CivilDateErrorCodes = {
  InvalidType: 'civil_date.invalid_type',
  InvalidFormat: 'civil_date.invalid_format',
  InvalidValue: 'civil_date.invalid_value',
} as const;

export type CivilDateErrorCode = (typeof CivilDateErrorCodes)[keyof typeof CivilDateErrorCodes];

export interface CivilDateError {
  readonly code: CivilDateErrorCode;
  readonly field: 'civilDate';
}

export const CivilTimeErrorCodes = {
  InvalidType: 'civil_time.invalid_type',
  InvalidFormat: 'civil_time.invalid_format',
  InvalidValue: 'civil_time.invalid_value',
} as const;

export type CivilTimeErrorCode = (typeof CivilTimeErrorCodes)[keyof typeof CivilTimeErrorCodes];

export interface CivilTimeError {
  readonly code: CivilTimeErrorCode;
  readonly field: 'civilTime';
}

export const TimeZoneIdErrorCodes = {
  InvalidType: 'time_zone_id.invalid_type',
  InvalidFormat: 'time_zone_id.invalid_format',
  Unknown: 'time_zone_id.unknown',
} as const;

export type TimeZoneIdErrorCode = (typeof TimeZoneIdErrorCodes)[keyof typeof TimeZoneIdErrorCodes];

export interface TimeZoneIdError {
  readonly code: TimeZoneIdErrorCode;
  readonly field: 'timeZoneId';
}

export const SchedulePeriodErrorCodes = {
  StartAfterEnd: 'schedule_period.start_after_end',
} as const;

export type SchedulePeriodErrorCode =
  (typeof SchedulePeriodErrorCodes)[keyof typeof SchedulePeriodErrorCodes];

export interface SchedulePeriodError {
  readonly code: SchedulePeriodErrorCode;
  readonly field: 'schedulePeriod';
}
