import { createSelector, createSelectorMemoized } from '@base-ui/utils/store';
import {
  TemporalFieldSection,
  TemporalFieldState as State,
  TemporalFieldNonRangeSection,
} from './types';
import { TemporalSupportedObject, TemporalSupportedValue } from '../../../types';
import { getDaysInWeekStr, getTimezoneToRender, removeLocalizedDigits } from './utils';
import { getMonthsInYear } from '../date-helpers';

const timezoneToRenderSelector = createSelectorMemoized(
  (state: State) => state.adapter,
  (state: State) => state.manager,
  (state: State) => state.value,
  (state: State) => state.referenceDateProp,
  (state: State) => state.timezoneProp,
  getTimezoneToRender,
);

const sectionManagerSelector = createSelectorMemoized(
  (state: State) => state.valueManager,
  (state: State) => state.sections,
  (state: State) => state.value,
  (valueManager, sections, value, sectionIndex: number) => {
    const section = sections[sectionIndex];

    return {
      ...section,
      index: sectionIndex,
      date: valueManager.getDateFromSection(value, section),
      update: (newSectionValue: string) => {
        const newSections = [...sections];
        newSections[sectionIndex] = {
          ...newSections[sectionIndex],
          value: newSectionValue,
          modified: true,
        };

        return newSections;
      },
    };
  },
) as <TValue extends TemporalSupportedValue>(
  state: State<TValue>,
  sectionIndex: number,
) => TemporalFieldSectionManager<TValue> | null;

export const selectors = {
  timezoneToRender: timezoneToRenderSelector,
  sections: createSelector((state: State) => state.sections) as <
    TValue extends TemporalSupportedValue,
  >(
    state: State<TValue>,
  ) => TemporalFieldSection<TValue>[],
  selectedSections: createSelector((state: State) => state.selectedSections),
  isSelectingAllSections: createSelector(
    (state: State) => state.selectedSections,
    (selectedSections) => selectedSections === 'all',
  ),
  section: sectionManagerSelector,
  activeSection: createSelector(
    (state: State) => state,
    (state: State) => (state.selectedSections === 'all' ? 0 : state.selectedSections),
    (state, sectionIndex) => {
      if (sectionIndex == null) {
        return null;
      }

      return sectionManagerSelector(state, sectionIndex);
    },
  ) as <TValue extends TemporalSupportedValue>(
    state: State<TValue>,
  ) => TemporalFieldSectionManager<TValue> | null,
  sectionBoundaries: createSelectorMemoized(
    (state: State) => state.adapter,
    (state: State) => state.localizedDigits,
    (state: State) => state.valueManager,
    (state: State) => state.value,
    timezoneToRenderSelector,
    (
      adapter,
      localizedDigits,
      valueManager,
      value,
      timezone,
      section: TemporalFieldNonRangeSection,
    ) => {
      switch (section.sectionType) {
        case 'year': {
          return {
            minimum: 0,
            maximum:
              adapter.formatByString(adapter.now('system'), section.format).length === 4
                ? 9999
                : 99,
          };
        }

        case 'month': {
          const today = adapter.now(timezone);
          const endOfYear = adapter.endOfYear(today);
          return {
            minimum: 1,
            // Assumption: All years have the same amount of months
            maximum: adapter.getMonth(endOfYear) + 1,
          };
        }

        case 'weekDay': {
          if (section.contentType === 'digit') {
            const daysInWeek = getDaysInWeekStr(adapter, section.format).map(Number);
            return {
              minimum: Math.min(...daysInWeek),
              maximum: Math.max(...daysInWeek),
            };
          }

          return {
            minimum: 1,
            maximum: 7,
          };
        }

        case 'day': {
          const today = adapter.now(timezone);
          const activeDate = valueManager.getDateFromSection(value, section);
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
            minimum: 1,
            maximum: adapter.isValid(activeDate)
              ? adapter.getDaysInMonth(activeDate)
              : maxDaysInMonth,
            longestMonth: longestMonth!,
          };
        }

        case 'hours': {
          const today = adapter.now(timezone);
          const endOfDay = adapter.endOfDay(today);
          const lastHourInDay = adapter.getHours(endOfDay);
          const hasMeridiem =
            removeLocalizedDigits(
              adapter.formatByString(adapter.endOfDay(today), section.format),
              localizedDigits,
            ) !== lastHourInDay.toString();

          if (hasMeridiem) {
            return {
              minimum: 1,
              maximum: Number(
                removeLocalizedDigits(
                  adapter.formatByString(adapter.startOfDay(today), section.format),
                  localizedDigits,
                ),
              ),
            };
          }

          return {
            minimum: 0,
            maximum: lastHourInDay,
          };
        }

        case 'seconds': {
          const today = adapter.now(timezone);
          const endOfDay = adapter.endOfDay(today);
          return {
            minimum: 0,
            // Assumption: All years have the same amount of seconds
            maximum: adapter.getSeconds(endOfDay),
          };
        }

        case 'minutes': {
          const today = adapter.now(timezone);
          const endOfDay = adapter.endOfDay(today);
          return {
            minimum: 0,
            // Assumption: All years have the same amount of minutes
            maximum: adapter.getMinutes(endOfDay),
          };
        }

        case 'meridiem': {
          return {
            minimum: 0,
            maximum: 1,
          };
        }

        default: {
          return {
            minimum: 0,
            maximum: 0,
          };
        }
      }
    },
  ),
};

type TemporalFieldSectionManager<TValue extends TemporalSupportedValue> =
  TemporalFieldSection<TValue> & {
    index: number;
    date: TemporalSupportedObject | null;
    update: (newSectionValue: string) => TemporalFieldSection<TValue>[];
  };
