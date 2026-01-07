import {
  TemporalAdapter,
  TemporalSupportedObject,
  TemporalSupportedValue,
  TemporalTimezone,
} from '../../../types';
import { TemporalFieldSectionValueBoundariesLookup } from './types';
import {
  cleanDigitSectionValue,
  getDaysInWeekStr,
  getLetterEditingOptions,
  removeLocalizedDigits,
} from './utils';
import { TemporalFieldStore } from './TemporalFieldStore';
import { selectors } from './selectors';
import { getMonthsInYear } from '../date-helpers';

export class TemporalFieldValueAdjustmentPlugin<TValue extends TemporalSupportedValue> {
  private store: TemporalFieldStore<TValue, any>;

  // We can't type `store`, otherwise we get the following TS error:
  // 'valueAdjustment' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;
  }

  public isAdjustSectionValueKeyCode(keyCode: string): keyCode is AdjustSectionValueKeyCode {
    return ['ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(keyCode);
  }

  public adjustActiveSectionValue(keyCode: AdjustSectionValueKeyCode) {
    const { adapter, localizedDigits, valueManager, value } = this.store.state;
    const timezone = selectors.timezoneToRender(this.store.state);
    const activeSection = selectors.activeSection<TValue>(this.store.state);

    if (activeSection == null) {
      return '';
    }

    const delta = getDeltaFromKeyCode(keyCode);
    const isStart = keyCode === 'Home';
    const isEnd = keyCode === 'End';
    const sectionsValueBoundaries = getSectionsBoundaries(adapter, localizedDigits, timezone);
    const activeDate = valueManager.getDateFromSection(value, activeSection.section);
    const shouldSetAbsolute = activeSection.section.value === '' || isStart || isEnd;

    // Digit section
    if (
      activeSection.section.contentType === 'digit' ||
      activeSection.section.contentType === 'digit-with-letter'
    ) {
      const sectionBoundaries = sectionsValueBoundaries[activeSection.section.sectionType]({
        currentDate: activeDate,
        format: activeSection.section.format,
        contentType: activeSection.section.contentType,
      });

      const getCleanValue = (newSectionValue: number) =>
        cleanDigitSectionValue(
          adapter,
          newSectionValue,
          sectionBoundaries,
          localizedDigits,
          activeSection.section,
        );

      const step =
        activeSection.section.sectionType === 'minutes' && stepsAttributes?.minutesStep
          ? stepsAttributes.minutesStep
          : 1;

      let newSectionValueNumber: number;

      if (shouldSetAbsolute) {
        if (activeSection.section.sectionType === 'year' && !isEnd && !isStart) {
          return adapter.formatByString(adapter.now(timezone), activeSection.section.format);
        }

        if (delta > 0 || isStart) {
          newSectionValueNumber = sectionBoundaries.minimum;
        } else {
          newSectionValueNumber = sectionBoundaries.maximum;
        }
      } else {
        const currentSectionValue = parseInt(
          removeLocalizedDigits(activeSection.section.value, localizedDigits),
          10,
        );
        newSectionValueNumber = currentSectionValue + delta * step;
      }

      if (newSectionValueNumber % step !== 0) {
        if (delta < 0 || isStart) {
          newSectionValueNumber += step - ((step + newSectionValueNumber) % step); // for JS -3 % 5 = -3 (should be 2)
        }
        if (delta > 0 || isEnd) {
          newSectionValueNumber -= newSectionValueNumber % step;
        }
      }

      if (newSectionValueNumber > sectionBoundaries.maximum) {
        return getCleanValue(
          sectionBoundaries.minimum +
            ((newSectionValueNumber - sectionBoundaries.maximum - 1) %
              (sectionBoundaries.maximum - sectionBoundaries.minimum + 1)),
        );
      }

      if (newSectionValueNumber < sectionBoundaries.minimum) {
        return getCleanValue(
          sectionBoundaries.maximum -
            ((sectionBoundaries.minimum - newSectionValueNumber - 1) %
              (sectionBoundaries.maximum - sectionBoundaries.minimum + 1)),
        );
      }

      return getCleanValue(newSectionValueNumber);
    }

    /// Letter section
    const options = getLetterEditingOptions(
      adapter,
      timezone,
      activeSection.section.sectionType,
      activeSection.section.format,
    );
    if (options.length === 0) {
      return activeSection.section.value;
    }

    if (shouldSetAbsolute) {
      if (delta > 0 || isStart) {
        return options[0];
      }

      return options[options.length - 1];
    }

    const currentOptionIndex = options.indexOf(activeSection.section.value);
    const newOptionIndex = (currentOptionIndex + delta) % options.length;
    const clampedIndex = (newOptionIndex + options.length) % options.length;

    return options[clampedIndex];
  }
}

function getDeltaFromKeyCode(keyCode: Omit<AdjustSectionValueKeyCode, 'Home' | 'End'>) {
  switch (keyCode) {
    case 'ArrowUp':
      return 1;
    case 'ArrowDown':
      return -1;
    case 'PageUp':
      return 5;
    case 'PageDown':
      return -5;
    default:
      return 0;
  }
}

type AdjustSectionValueKeyCode = 'ArrowUp' | 'ArrowDown' | 'PageUp' | 'PageDown' | 'Home' | 'End';

function isFourDigitYearFormat(adapter: TemporalAdapter, format: string) {
  return adapter.formatByString(adapter.now('system'), format).length === 4;
}

function getSectionsBoundaries(
  adapter: TemporalAdapter,
  localizedDigits: string[],
  timezone: TemporalTimezone,
): TemporalFieldSectionValueBoundariesLookup {
  const today = adapter.now(timezone);
  const endOfYear = adapter.endOfYear(today);
  const endOfDay = adapter.endOfDay(today);

  const { maxDaysInMonth, longestMonth } = getMonthsInYear(adapter, today).reduce(
    (acc, month) => {
      const daysInMonth = adapter.getDaysInMonth(month);

      if (daysInMonth > acc.maxDaysInMonth) {
        return { maxDaysInMonth: daysInMonth, longestMonth: month };
      }

      return acc;
    },
    { maxDaysInMonth: 0, longestMonth: null as TemporalSupportedObject | null },
  );

  return {
    year: ({ format }) => ({
      minimum: 0,
      maximum: isFourDigitYearFormat(adapter, format) ? 9999 : 99,
    }),
    month: () => ({
      minimum: 1,
      // Assumption: All years have the same amount of months
      maximum: adapter.getMonth(endOfYear) + 1,
    }),
    day: ({ currentDate }) => ({
      minimum: 1,
      maximum: adapter.isValid(currentDate) ? adapter.getDaysInMonth(currentDate) : maxDaysInMonth,
      longestMonth: longestMonth!,
    }),
    weekDay: ({ format, contentType }) => {
      if (contentType === 'digit') {
        const daysInWeek = getDaysInWeekStr(adapter, format).map(Number);
        return {
          minimum: Math.min(...daysInWeek),
          maximum: Math.max(...daysInWeek),
        };
      }

      return {
        minimum: 1,
        maximum: 7,
      };
    },
    hours: ({ format }) => {
      const lastHourInDay = adapter.getHours(endOfDay);
      const hasMeridiem =
        removeLocalizedDigits(
          adapter.formatByString(adapter.endOfDay(today), format),
          localizedDigits,
        ) !== lastHourInDay.toString();

      if (hasMeridiem) {
        return {
          minimum: 1,
          maximum: Number(
            removeLocalizedDigits(
              adapter.formatByString(adapter.startOfDay(today), format),
              localizedDigits,
            ),
          ),
        };
      }

      return {
        minimum: 0,
        maximum: lastHourInDay,
      };
    },
    minutes: () => ({
      minimum: 0,
      // Assumption: All years have the same amount of minutes
      maximum: adapter.getMinutes(endOfDay),
    }),
    seconds: () => ({
      minimum: 0,
      // Assumption: All years have the same amount of seconds
      maximum: adapter.getSeconds(endOfDay),
    }),
    meridiem: () => ({
      minimum: 0,
      maximum: 1,
    }),
    empty: () => ({
      minimum: 0,
      maximum: 0,
    }),
  };
}
