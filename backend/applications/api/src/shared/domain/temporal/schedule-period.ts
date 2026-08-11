import { failure, success, type Result } from '@/shared/core/result';
import { ValueObject } from '@/shared/domain/value-object';

import type { CivilDate } from './civil-date';
import { SchedulePeriodErrorCodes, type SchedulePeriodError } from './temporal-error';

interface SchedulePeriodProps {
  readonly startDate: CivilDate;
  readonly endDate: CivilDate;
}

export class SchedulePeriod extends ValueObject<SchedulePeriodProps, 'SchedulePeriod'> {
  private constructor(startDate: CivilDate, endDate: CivilDate) {
    super({ startDate, endDate });
    Object.freeze(this);
  }

  static create(
    startDate: CivilDate,
    endDate: CivilDate,
  ): Result<SchedulePeriod, SchedulePeriodError> {
    if (startDate.compareTo(endDate) > 0) {
      return failure({
        code: SchedulePeriodErrorCodes.StartAfterEnd,
        field: 'schedulePeriod',
      });
    }

    return success(new SchedulePeriod(startDate, endDate));
  }

  get startDate(): CivilDate {
    return this.props.startDate;
  }

  get endDate(): CivilDate {
    return this.props.endDate;
  }

  includes(date: CivilDate): boolean {
    return this.startDate.compareTo(date) <= 0 && date.compareTo(this.endDate) <= 0;
  }
}
