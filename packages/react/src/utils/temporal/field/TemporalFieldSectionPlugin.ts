import { createSelector, createSelectorMemoized } from '@base-ui/utils/store';
import { TemporalSupportedObject, TemporalSupportedValue } from '../../../types';
import { mergeDateIntoReferenceDate } from './mergeDateIntoReferenceDate';
import { selectors } from './selectors';
import type { TemporalFieldStore } from './TemporalFieldStore';
import {
  TemporalFieldSection,
  TemporalFieldSelectedSections,
  TemporalFieldState as State,
} from './types';
import { getDaysInWeekStr, removeLocalizedDigits } from './utils';
import { getMonthsInYear } from '../date-helpers';
import { TemporalFieldValuePlugin } from './TemporalFieldValuePlugin';

const sectionSelectors = {
  sections: createSelector((state: State) => state.sections),
  lastSectionIndex: createSelector((state: State) => state.sections.length - 1),
  selectedSections: createSelector((state: State) => state.selectedSections),
  isSelectingAllSections: createSelector((state: State) => state.selectedSections === 'all'),
  section: createSelectorMemoized(
    (state: State) => state.sections,
    (sections, sectionIndex: number) => ({ ...sections[sectionIndex], index: sectionIndex }),
  ),
  activeSection: createSelectorMemoized(
    (state: State) => state.sections,
    (state: State) => (state.selectedSections === 'all' ? 0 : state.selectedSections),
    (sections, activeSectionIndex) => {
      if (activeSectionIndex == null) {
        return null;
      }

      return {
        ...sections[activeSectionIndex],
        index: activeSectionIndex,
      };
    },
  ),
  sectionBoundaries: createSelectorMemoized(
    (state: State) => state.config,
    (state: State) => state.value,
    selectors.adapter,
    selectors.localizedDigits,
    selectors.timezoneToRender,
    (fieldConfig, value, adapter, localizedDigits, timezone, section: TemporalFieldSection) => {
      switch (section.token.config.sectionType) {
        case 'year': {
          return {
            minimum: 0,
            maximum:
              adapter.formatByString(adapter.now('system'), section.token.tokenValue).length === 4
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
          if (section.token.config.contentType === 'digit') {
            const daysInWeek = getDaysInWeekStr(adapter, section.token.tokenValue).map(Number);
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
          const activeDate = fieldConfig.getDateFromSection(value, section);
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
              adapter.formatByString(adapter.endOfDay(today), section.token.tokenValue),
              localizedDigits,
            ) !== lastHourInDay.toString();

          if (hasMeridiem) {
            return {
              minimum: 1,
              maximum: Number(
                removeLocalizedDigits(
                  adapter.formatByString(adapter.startOfDay(today), section.token.tokenValue),
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

/**
 * Plugin to interact with a single section of the field value.
 */
export class TemporalFieldSectionPlugin<TValue extends TemporalSupportedValue> {
  private store: TemporalFieldStore<TValue, any, any>;

  public sectionToUpdateOnNextInvalidDate: { index: number; value: string } | null = null;

  public static selectors = sectionSelectors;

  // We can't type `store`, otherwise we get the following TS error:
  // 'section' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;
  }

  public getRenderedValue(section: TemporalFieldSection) {
    return section.value || section.token.placeholder;
  }

  public getRenderedValueWithSeparators(section: TemporalFieldSection) {
    return `${this.getRenderedValue(section)}${section.token.separator}`;
  }

  /**
   * Clears the value of the active section.
   */
  public clearActive() {
    const value = TemporalFieldValuePlugin.selectors.value(this.store.state);
    const fieldConfig = selectors.config(this.store.state);
    const activeSection = TemporalFieldSectionPlugin.selectors.activeSection(this.store.state);
    const sections = TemporalFieldSectionPlugin.selectors.sections(this.store.state);
    if (activeSection == null || activeSection.value === '') {
      return;
    }

    this.setSectionUpdateToApplyOnNextInvalidDate(activeSection.index, '');

    if (fieldConfig.getDateFromSection(value, activeSection) === null) {
      this.store.update({
        sections: TemporalFieldSectionPlugin.replaceSectionValueInSectionList(
          sections,
          activeSection.index,
          '',
        ),
        characterQuery: null,
      });
    } else {
      this.store.characterEditing.resetCharacterQuery();
      this.store.value.publish(fieldConfig.updateDateInValue(value, activeSection, null));
    }
  }

  /**
   * Sets the value of the provided section.
   * If "shouldGoToNextSection" is true, moves the focus to the next section.
   */
  public updateValue({
    sectionIndex,
    newSectionValue,
    shouldGoToNextSection,
  }: UpdateValueParameters) {
    const value = TemporalFieldValuePlugin.selectors.value(this.store.state);
    const fieldConfig = selectors.config(this.store.state);
    const referenceValue = TemporalFieldValuePlugin.selectors.referenceValue(this.store.state);
    const adapter = selectors.adapter(this.store.state);
    const lastSectionIndex = TemporalFieldSectionPlugin.selectors.lastSectionIndex(
      this.store.state,
    );
    const section = TemporalFieldSectionPlugin.selectors.section(this.store.state, sectionIndex);
    const sections = TemporalFieldSectionPlugin.selectors.sections(this.store.state);

    this.store.timeoutManager.clearTimeout('updateSectionValueOnNextInvalidDate');
    this.store.timeoutManager.clearTimeout('cleanActiveDateSectionsIfValueNull');

    const activeDate = fieldConfig.getDateFromSection(value, section);

    /**
     * Decide which section should be focused
     */
    if (shouldGoToNextSection && sectionIndex < lastSectionIndex) {
      this.setSelectedSections(sectionIndex + 1);
    }

    /**
     * Try to build a valid date from the new section value
     */
    const newSections = TemporalFieldSectionPlugin.replaceSectionValueInSectionList(
      sections,
      sectionIndex,
      newSectionValue,
    );
    const newActiveDateSections = fieldConfig.getDateSectionsFromValue(newSections, section);
    const newActiveDate = this.getDateFromDateSections(newActiveDateSections);

    /**
     * If the new date is valid,
     * Then we merge the value of the modified sections into the reference date.
     * This makes sure that we don't lose some information of the initial date (like the time on a date field).
     */
    if (adapter.isValid(newActiveDate)) {
      const mergedDate = mergeDateIntoReferenceDate(
        adapter,
        newActiveDate,
        newActiveDateSections,
        fieldConfig.getDateFromSection(referenceValue as any, section)!,
        true,
      );

      if (activeDate == null) {
        this.store.timeoutManager.startTimeout('cleanActiveDateSectionsIfValueNull', 0, () => {
          if (this.store.state.value === value) {
            this.store.set('sections', fieldConfig.clearDateSections(sections, section));
          }
        });
      }

      return this.store.value.publish(fieldConfig.updateDateInValue(value, section, mergedDate));
    }

    /**
     * If all the sections are filled but the date is invalid and the previous date is valid or null,
     * Then we publish an invalid date.
     */
    if (
      newActiveDateSections.every((sectionBis) => sectionBis.value !== '') &&
      (activeDate == null || adapter.isValid(activeDate))
    ) {
      this.setSectionUpdateToApplyOnNextInvalidDate(sectionIndex, newSectionValue);
      return this.store.value.publish(fieldConfig.updateDateInValue(value, section, newActiveDate));
    }

    /**
     * If the previous date is not null,
     * Then we publish the date as `newActiveDate to prevent error state oscillation`.
     * @link: https://github.com/mui/mui-x/issues/17967
     */
    if (activeDate != null) {
      this.setSectionUpdateToApplyOnNextInvalidDate(sectionIndex, newSectionValue);
      this.store.value.publish(fieldConfig.updateDateInValue(value, section, newActiveDate));
    }

    /**
     * If the previous date is already null,
     * Then we don't publish the date and we update the sections.
     */
    return this.store.set('sections', newSections);
  }

  public setSelectedSections(selectedSections: TemporalFieldSelectedSections) {
    this.store.set('selectedSections', selectedSections);
  }

  public static replaceSectionValueInSectionList(
    sections: TemporalFieldSection[],
    sectionIndex: number,
    newSectionValue: string,
  ) {
    const newSections = [...sections];
    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      value: newSectionValue,
      modified: true,
    };

    return newSections;
  }

  /**
   * Some date libraries like `dayjs` don't support parsing from date with escaped characters.
   * To make sure that the parsing works, we are building a format and a date without any separator.
   */
  private getDateFromDateSections(sections: TemporalFieldSection[]) {
    const adapter = selectors.adapter(this.store.state);
    const timezone = selectors.timezoneToRender(this.store.state);

    // If we have both a day and a weekDay section,
    // Then we skip the weekDay in the parsing because libraries like dayjs can't parse complicated formats containing a weekDay.
    // dayjs(dayjs().format('dddd MMMM D YYYY'), 'dddd MMMM D YYYY')) // returns `Invalid Date` even if the format is valid.
    const shouldSkipWeekDays = sections.some(
      (section) => section.token.config.sectionType === 'day',
    );

    const sectionFormats: string[] = [];
    const sectionValues: string[] = [];
    for (let i = 0; i < sections.length; i += 1) {
      const section = sections[i];

      const shouldSkip = shouldSkipWeekDays && section.token.config.sectionType === 'weekDay';
      if (!shouldSkip) {
        sectionFormats.push(section.token.tokenValue);
        sectionValues.push(this.getRenderedValue(section));
      }
    }

    const formatWithoutSeparator = sectionFormats.join(' ');
    const dateWithoutSeparatorStr = sectionValues.join(' ');

    return adapter.parse(dateWithoutSeparatorStr, formatWithoutSeparator, timezone);
  }

  private setSectionUpdateToApplyOnNextInvalidDate = (
    sectionIndex: number,
    sectionValue: string,
  ) => {
    this.sectionToUpdateOnNextInvalidDate = {
      index: sectionIndex,
      value: sectionValue,
    };
    this.store.timeoutManager.startTimeout('updateSectionValueOnNextInvalidDate', 0, () => {
      this.sectionToUpdateOnNextInvalidDate = null;
    });
  };
}

interface UpdateValueParameters {
  /**
   * The section on which we want to apply the new value.
   */
  sectionIndex: number;
  /**
   * Value to apply to the active section.
   */
  newSectionValue: string;
  /**
   * If `true`, the focus will move to the next section.
   */
  shouldGoToNextSection: boolean;
}
