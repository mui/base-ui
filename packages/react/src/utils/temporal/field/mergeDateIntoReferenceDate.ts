import {
  TemporalAdapter,
  TemporalFieldDatePartType,
  TemporalSupportedObject,
} from '../../../types';
import { TemporalFieldDatePart, TemporalFieldSection } from './types';
import { cleanLeadingZeros, getDaysInWeekStr, isDatePart } from './utils';

function transferDatePartValue(
  adapter: TemporalAdapter,
  section: TemporalFieldDatePart,
  dateToTransferFrom: TemporalSupportedObject,
  dateToTransferTo: TemporalSupportedObject,
) {
  switch (section.token.config.part) {
    case 'year': {
      return adapter.setYear(dateToTransferTo, adapter.getYear(dateToTransferFrom));
    }

    case 'month': {
      return adapter.setMonth(dateToTransferTo, adapter.getMonth(dateToTransferFrom));
    }

    case 'weekDay': {
      let dayInWeekStrOfActiveDate = adapter.formatByString(
        dateToTransferFrom,
        section.token.value,
      );
      if (section.token.isPadded) {
        dayInWeekStrOfActiveDate = cleanLeadingZeros(
          dayInWeekStrOfActiveDate,
          section.token.maxLength!,
        );
      }

      const formattedDaysInWeek = getDaysInWeekStr(adapter, section.token.value);
      const dayInWeekOfActiveDate = formattedDaysInWeek.indexOf(dayInWeekStrOfActiveDate);
      const dayInWeekOfNewDatePartValue = formattedDaysInWeek.indexOf(section.value);
      const diff = dayInWeekOfNewDatePartValue - dayInWeekOfActiveDate;
      return adapter.addDays(dateToTransferFrom, diff);
    }

    case 'day': {
      return adapter.setDate(dateToTransferTo, adapter.getDate(dateToTransferFrom));
    }

    case 'meridiem': {
      const isAM = adapter.getHours(dateToTransferFrom) < 12;
      const mergedDateHours = adapter.getHours(dateToTransferTo);

      if (isAM && mergedDateHours >= 12) {
        return adapter.addHours(dateToTransferTo, -12);
      }

      if (!isAM && mergedDateHours < 12) {
        return adapter.addHours(dateToTransferTo, 12);
      }

      return dateToTransferTo;
    }

    case 'hours': {
      return adapter.setHours(dateToTransferTo, adapter.getHours(dateToTransferFrom));
    }

    case 'minutes': {
      return adapter.setMinutes(dateToTransferTo, adapter.getMinutes(dateToTransferFrom));
    }

    case 'seconds': {
      return adapter.setSeconds(dateToTransferTo, adapter.getSeconds(dateToTransferFrom));
    }

    default: {
      return dateToTransferTo;
    }
  }
}

const reliableSectionModificationOrder: Record<TemporalFieldDatePartType, number> = {
  year: 1,
  month: 2,
  day: 3,
  weekDay: 4,
  hours: 5,
  minutes: 6,
  seconds: 7,
  meridiem: 8,
};

export function mergeDateIntoReferenceDate(
  adapter: TemporalAdapter,
  dateToTransferFrom: TemporalSupportedObject,
  sections: TemporalFieldSection[],
  referenceDate: TemporalSupportedObject,
  shouldLimitToEditedSections: boolean,
): TemporalSupportedObject {
  return sections
    .filter(isDatePart)
    .sort(
      (a, b) =>
        reliableSectionModificationOrder[a.token.config.part] -
        reliableSectionModificationOrder[b.token.config.part],
    )
    .reduce((mergedDate, section) => {
      if (!shouldLimitToEditedSections || section.modified) {
        return transferDatePartValue(adapter, section, dateToTransferFrom, mergedDate);
      }

      return mergedDate;
    }, referenceDate);
}
