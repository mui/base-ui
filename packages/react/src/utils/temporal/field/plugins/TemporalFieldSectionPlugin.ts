import { createSelector, createSelectorMemoized } from '@base-ui/utils/store';
import { TemporalSupportedValue } from '../../../../types';
import { mergeDateIntoReferenceDate } from '../mergeDateIntoReferenceDate';
import { selectors } from '../selectors';
import type { TemporalFieldStore } from '../TemporalFieldStore';
import { TemporalFieldState as State, TemporalFieldDatePart, TemporalFieldSection } from '../types';
import {
  getLocalizedDigits,
  getWeekDaysStr,
  getLongestMonthInCurrentYear,
  getYearFormatLength,
} from '../adapter-cache';
import { isDatePart, removeLocalizedDigits } from '../utils';
import { TemporalFieldValuePlugin } from './TemporalFieldValuePlugin';

const datePartBoundaries = createSelectorMemoized(
  (state: State) => state.config,
  (state: State) => state.value,
  selectors.adapter,
  selectors.timezoneToRender,
  (fieldConfig, value, adapter, timezone, datePart: TemporalFieldDatePart) => {
    const localizedDigits = getLocalizedDigits(adapter);
    if (!isDatePart(datePart)) {
      return { minimum: 0, maximum: 0 };
    }

    switch (datePart.token.config.part) {
      case 'year': {
        return {
          minimum: 0,
          maximum: getYearFormatLength(adapter, datePart.token.value) === 4 ? 9999 : 99,
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
        if (datePart.token.config.contentType === 'digit') {
          const daysInWeek = getWeekDaysStr(adapter, datePart.token.value).map(Number);
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
        const activeDate = fieldConfig.getDateFromSection(value, datePart);
        return {
          minimum: 1,
          maximum: adapter.isValid(activeDate)
            ? adapter.getDaysInMonth(activeDate)
            : adapter.getDaysInMonth(getLongestMonthInCurrentYear(adapter)),
        };
      }

      case 'hours': {
        const today = adapter.now(timezone);
        const endOfDay = adapter.endOfDay(today);
        const lastHourInDay = adapter.getHours(endOfDay);
        const hasMeridiem =
          removeLocalizedDigits(
            adapter.formatByString(adapter.endOfDay(today), datePart.token.value),
            localizedDigits,
          ) !== lastHourInDay.toString();

        if (hasMeridiem) {
          return {
            minimum: 1,
            maximum: Number(
              removeLocalizedDigits(
                adapter.formatByString(adapter.startOfDay(today), datePart.token.value),
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
);

const sectionSelectors = {
  sections: createSelector((state: State) => state.sections),
  selectedSection: createSelector((state: State) => state.selectedSection),
  datePart: createSelectorMemoized(
    (state: State) => state.sections,
    (sections, sectionIndex: number) => {
      if (!isDatePart(sections[sectionIndex])) {
        return null;
      }

      return { ...sections[sectionIndex], index: sectionIndex };
    },
  ),
  activeDatePart: createSelectorMemoized(
    (state: State) => state.sections,
    (state: State) => state.selectedSection,
    (sections, activeSectionIndex): TemporalFieldDatePart | null => {
      if (activeSectionIndex == null) {
        return null;
      }

      const activeSection = sections[activeSectionIndex];
      if (!isDatePart(activeSection)) {
        return null;
      }

      return {
        ...activeSection,
        index: activeSectionIndex,
      };
    },
  ),
  datePartBoundaries,
  datePartAdjustmentBoundaries: createSelectorMemoized(
    (state: State) => state.config,
    selectors.adapter,
    selectors.validationProps,
    datePartBoundaries,
    (
      fieldConfig,
      adapter,
      validationProps,
      structuralBoundaries,
      datePart: TemporalFieldDatePart,
    ) => {
      return fieldConfig.getAdjustmentBoundaries(
        adapter,
        validationProps,
        datePart,
        structuralBoundaries,
      );
    },
  ),
};

/**
 * Plugin to interact with a single section of the field value.
 */
export class TemporalFieldSectionPlugin<TValue extends TemporalSupportedValue> {
  private store: TemporalFieldStore<TValue, any>;

  public sectionToUpdateOnNextInvalidDate: { index: number; value: string } | null = null;

  public static selectors = sectionSelectors;

  // We can't type `store`, otherwise we get the following TS error:
  // 'section' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;
  }

  public getDatePartRenderedValue(datePart: TemporalFieldDatePart) {
    return datePart.value || datePart.token.placeholder;
  }

  /**
   * Clears the value of the active section.
   */
  public clearActive() {
    const value = TemporalFieldValuePlugin.selectors.value(this.store.state);
    const fieldConfig = selectors.config(this.store.state);
    const activeDatePart = TemporalFieldSectionPlugin.selectors.activeDatePart(this.store.state);
    const sections = TemporalFieldSectionPlugin.selectors.sections(this.store.state);
    if (activeDatePart == null || activeDatePart.value === '') {
      return;
    }

    this.setSectionUpdateToApplyOnNextInvalidDate(activeDatePart.index, '');

    if (fieldConfig.getDateFromSection(value, activeDatePart) === null) {
      this.store.update({
        sections: TemporalFieldSectionPlugin.replaceDatePartValueInSectionList(
          sections,
          activeDatePart.index,
          '',
        ),
        characterQuery: null,
      });
    } else {
      this.store.characterEditing.resetCharacterQuery();
      this.store.value.publish(fieldConfig.updateDateInValue(value, activeDatePart, null));
    }
  }

  /**
   * Sets the value of the provided section.
   * If "shouldGoToNextSection" is true, moves the focus to the next section.
   */
  public updateDatePart({
    sectionIndex,
    newDatePartValue,
    shouldGoToNextSection,
  }: UpdateValueParameters) {
    const value = TemporalFieldValuePlugin.selectors.value(this.store.state);
    const fieldConfig = selectors.config(this.store.state);
    const referenceValue = TemporalFieldValuePlugin.selectors.referenceValue(this.store.state);
    const adapter = selectors.adapter(this.store.state);
    const section = TemporalFieldSectionPlugin.selectors.datePart(this.store.state, sectionIndex);
    if (section == null) {
      return undefined;
    }

    const sections = TemporalFieldSectionPlugin.selectors.sections(this.store.state);

    this.store.timeoutManager.clearTimeout('updateSectionValueOnNextInvalidDate');
    this.store.timeoutManager.clearTimeout('cleanActiveDateSectionsIfValueNull');

    const activeDate = fieldConfig.getDateFromSection(value, section);

    /**
     * Decide which section should be focused
     */
    if (shouldGoToNextSection) {
      this.selectNextDatePart();
    }

    /**
     * Try to build a valid date from the new section value
     */
    const newSections = TemporalFieldSectionPlugin.replaceDatePartValueInSectionList(
      sections,
      sectionIndex,
      newDatePartValue,
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
      this.setSectionUpdateToApplyOnNextInvalidDate(sectionIndex, newDatePartValue);
      return this.store.value.publish(fieldConfig.updateDateInValue(value, section, newActiveDate));
    }

    /**
     * If the previous date is not null,
     * Then we publish the date as `newActiveDate to prevent error state oscillation`.
     * @link: https://github.com/mui/mui-x/issues/17967
     */
    if (activeDate != null) {
      this.setSectionUpdateToApplyOnNextInvalidDate(sectionIndex, newDatePartValue);
      this.store.value.publish(fieldConfig.updateDateInValue(value, section, newActiveDate));
    }

    /**
     * If the previous date is already null,
     * Then we don't publish the date and we update the sections.
     */
    return this.store.set('sections', newSections);
  }

  public selectClosestDatePart(sectionIndex: number) {
    const sections = TemporalFieldSectionPlugin.selectors.sections(this.store.state);
    let closestIndex = sectionIndex;
    while (closestIndex > 0 && !isDatePart(sections[closestIndex])) {
      closestIndex -= 1;
    }

    if (isDatePart(sections[closestIndex])) {
      this.store.set('selectedSection', closestIndex);
    }
  }

  public selectNextDatePart() {
    const selectedSection = TemporalFieldSectionPlugin.selectors.selectedSection(this.store.state);
    if (selectedSection == null) {
      return;
    }

    const sections = TemporalFieldSectionPlugin.selectors.sections(this.store.state);
    if (selectedSection >= sections.length - 1) {
      return;
    }

    let nextIndex = selectedSection + 1;
    while (nextIndex < sections.length && !isDatePart(sections[nextIndex])) {
      nextIndex += 1;
    }

    if (isDatePart(sections[nextIndex])) {
      this.store.set('selectedSection', nextIndex);
    }
  }

  public selectPreviousDatePart() {
    const selectedSection = TemporalFieldSectionPlugin.selectors.selectedSection(this.store.state);
    if (selectedSection == null) {
      return;
    }

    const sections = TemporalFieldSectionPlugin.selectors.sections(this.store.state);
    if (selectedSection <= 0) {
      return;
    }

    let previousIndex = selectedSection - 1;
    while (previousIndex >= 0 && !isDatePart(sections[previousIndex])) {
      previousIndex -= 1;
    }

    if (isDatePart(sections[previousIndex])) {
      this.store.set('selectedSection', previousIndex);
    }
  }

  public removeSelectedSection() {
    this.store.set('selectedSection', null);
  }

  public static replaceDatePartValueInSectionList(
    sections: TemporalFieldSection[],
    sectionIndex: number,
    newDatePartValue: string,
  ) {
    const newSections = [...sections];
    newSections[sectionIndex] = {
      ...newSections[sectionIndex],
      value: newDatePartValue,
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
      (section) => isDatePart(section) && section.token.config.part === 'day',
    );

    const sectionFormats: string[] = [];
    const sectionValues: string[] = [];
    for (let i = 0; i < sections.length; i += 1) {
      const section = sections[i];

      const shouldSkip =
        !isDatePart(section) || (shouldSkipWeekDays && section.token.config.part === 'weekDay');
      if (!shouldSkip) {
        sectionFormats.push(section.token.value);
        sectionValues.push(this.getDatePartRenderedValue(section));
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
  newDatePartValue: string;
  /**
   * If `true`, the focus will move to the next section.
   */
  shouldGoToNextSection: boolean;
}
