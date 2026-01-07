import { TemporalSupportedValue } from '../../../types';
import { mergeDateIntoReferenceDate } from './mergeDateIntoReferenceDate';
import { selectors } from './selectors';
import type { TemporalFieldStore } from './TemporalFieldStore';
import { TemporalFieldSection, TemporalFieldSelectedSections } from './types';
import { getDateFromDateSections } from './utils';

/**
 * Plugin to interact with a single section of the field value.
 */
export class TemporalFieldSectionPlugin<TValue extends TemporalSupportedValue> {
  private store: TemporalFieldStore<TValue, any>;

  private sectionToUpdateOnNextInvalidDate: { index: number; value: string } | null = null;

  // We can't type `store`, otherwise we get the following TS error:
  // 'section' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;
  }

  public getRenderedValue(section: TemporalFieldSection<TValue>) {
    return section.value || this.getPlaceholder(section);
  }

  public getRenderedValueWithSeparators(section: TemporalFieldSection<TValue>) {
    return `${section.startSeparator}${this.getRenderedValue(section)}${section.endSeparator}`;
  }

  public clearActive() {
    const { valueManager, value } = this.store.state;
    const activeSection = selectors.activeSection<TValue>(this.store.state);
    if (activeSection == null || activeSection.value === '') {
      return;
    }

    this.setSectionUpdateToApplyOnNextInvalidDate(activeSection.index, '');

    if (activeSection.date === null) {
      this.store.update({
        sections: activeSection.update(''),
        tempValueStrAndroid: null,
        characterQuery: null,
      });
    } else {
      this.store.characterEditing.resetCharacterQuery();
      this.store.value.publish(valueManager.updateDateInValue(value, activeSection, null));
    }
  }

  public updateValue({
    sectionIndex,
    newSectionValue,
    shouldGoToNextSection,
  }: UpdateValueParameters) {
    const { valueManager, adapter, referenceValue, value, localizedDigits } = this.store.state;
    const sections = selectors.sections<TValue>(this.store.state);
    const section = selectors.section<TValue>(this.store.state, sectionIndex);
    if (section == null) {
      return undefined;
    }

    this.store.timeoutManager.clearTimeout('updateSectionValueOnNextInvalidDate');
    this.store.timeoutManager.clearTimeout('cleanActiveDateSectionsIfValueNull');

    const activeDate = valueManager.getDateFromSection(value, section);

    /**
     * Decide which section should be focused
     */
    if (shouldGoToNextSection && section.index! < sections.length - 1) {
      this.setSelectedSections(section.index! + 1);
    }

    /**
     * Try to build a valid date from the new section value
     */
    const newSections = section.update(newSectionValue);
    const newActiveDateSections = valueManager.getDateSectionsFromValue(newSections, section);
    const newActiveDate = getDateFromDateSections(adapter, newActiveDateSections, localizedDigits);

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
        valueManager.getDateFromSection(referenceValue as any, section)!,
        true,
      );

      if (activeDate == null) {
        this.store.timeoutManager.startTimeout('cleanActiveDateSectionsIfValueNull', 0, () => {
          if (this.store.state.value === value) {
            this.store.update({
              sections: valueManager.clearDateSections(sections, section),
              tempValueStrAndroid: null,
            });
          }
        });
      }

      return this.store.value.publish(valueManager.updateDateInValue(value, section, mergedDate));
    }

    /**
     * If all the sections are filled but the date is invalid and the previous date is valid or null,
     * Then we publish an invalid date.
     */
    if (
      newActiveDateSections.every((sectionBis) => sectionBis.value !== '') &&
      (activeDate == null || adapter.isValid(activeDate))
    ) {
      this.setSectionUpdateToApplyOnNextInvalidDate(section.index, newSectionValue);
      return this.store.value.publish(
        valueManager.updateDateInValue(value, section, newActiveDate),
      );
    }

    /**
     * If the previous date is not null,
     * Then we publish the date as `newActiveDate to prevent error state oscillation`.
     * @link: https://github.com/mui/mui-x/issues/17967
     */
    if (activeDate != null) {
      this.setSectionUpdateToApplyOnNextInvalidDate(section.index, newSectionValue);
      this.store.value.publish(valueManager.updateDateInValue(value, section, newActiveDate));
    }

    /**
     * If the previous date is already null,
     * Then we don't publish the date and we update the sections.
     */
    return this.store.update({
      sections: newSections,
      tempValueStrAndroid: null,
    });
  }

  public setSelectedSections(selectedSections: TemporalFieldSelectedSections) {
    this.store.set('selectedSections', selectedSections);
  }

  private getPlaceholder(section: TemporalFieldSection<TValue>) {
    const { adapter, placeholderGetters } = this.store.state;
    switch (section.sectionType) {
      case 'year': {
        return placeholderGetters.year({
          digitAmount: adapter.formatByString(adapter.now('default'), section.format).length,
          format: section.format,
        });
      }

      case 'month': {
        return placeholderGetters.month({
          contentType: section.contentType,
          format: section.format,
        });
      }

      case 'day': {
        return placeholderGetters.day({ format: section.format });
      }

      case 'weekDay': {
        return placeholderGetters.weekDay({
          contentType: section.contentType,
          format: section.format,
        });
      }

      case 'hours': {
        return placeholderGetters.hours({ format: section.format });
      }

      case 'minutes': {
        return placeholderGetters.minutes({ format: section.format });
      }

      case 'seconds': {
        return placeholderGetters.seconds({ format: section.format });
      }

      case 'meridiem': {
        return placeholderGetters.meridiem({ format: section.format });
      }

      default: {
        return section.format;
      }
    }
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
