import { Temporal } from '@js-temporal/polyfill';
import { failure, success } from '@/shared/core/result';
import { Instant } from '@/shared/domain/instant';
import {
  CivilScheduleResolutionErrorCodes,
  type CivilScheduleResolver,
  type ScheduleDisambiguation,
} from '../application';
import { ResolvedUtcOffset } from '../domain';

export class TemporalCivilScheduleResolver implements CivilScheduleResolver {
  resolve(input: Parameters<CivilScheduleResolver['resolve']>[0]) {
    const plain = Temporal.PlainDateTime.from(
      `${input.civilDate.toISOString()}T${input.civilTime.toISOString()}`,
    );
    const fields = {
      year: plain.year,
      month: plain.month,
      day: plain.day,
      hour: plain.hour,
      minute: plain.minute,
      timeZone: input.timeZoneId.toString(),
    };
    try {
      return success(
        this.resolution(Temporal.ZonedDateTime.from(fields, { disambiguation: 'reject' })),
      );
    } catch (error: unknown) {
      if (!(error instanceof RangeError)) throw error;
      const earlier = Temporal.ZonedDateTime.from(fields, { disambiguation: 'earlier' });
      const later = Temporal.ZonedDateTime.from(fields, { disambiguation: 'later' });
      const ambiguous =
        earlier.toPlainDateTime().equals(plain) && later.toPlainDateTime().equals(plain);
      if (!ambiguous)
        return failure({
          code: CivilScheduleResolutionErrorCodes.NonexistentLocalTime,
          field: 'time',
        });
      if (input.disambiguation === undefined)
        return failure({
          code: CivilScheduleResolutionErrorCodes.AmbiguousLocalTime,
          field: 'disambiguation',
          params: { earlierOffset: earlier.offset, laterOffset: later.offset },
        });
      return success(this.resolution(this.select(input.disambiguation, earlier, later)));
    }
  }

  private select(
    disambiguation: ScheduleDisambiguation,
    earlier: Temporal.ZonedDateTime,
    later: Temporal.ZonedDateTime,
  ): Temporal.ZonedDateTime {
    return disambiguation === 'earlier' ? earlier : later;
  }

  private resolution(zoned: Temporal.ZonedDateTime) {
    const instant = Instant.create(new Date(zoned.epochMilliseconds).toISOString());
    if (!instant.success) throw new Error('temporal_civil_schedule_resolver.invalid_instant');
    return Object.freeze({
      scheduledAt: instant.value,
      resolvedOffset: ResolvedUtcOffset.create(zoned.offset),
    });
  }
}
