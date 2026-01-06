import { Store } from '@base-ui/utils/store';
import {
  TemporalAdapter,
  TemporalFieldSectionType,
  TemporalSupportedObject,
  TemporalSupportedValue,
} from '../../../types';
import { TemporalManager } from '../types';
import {
  TemporalFieldSelectedSections,
  TemporalFieldState,
  TemporalFieldStoreParameters,
  TemporalFieldValueChangeHandlerContext,
  TemporalFieldValueManager,
} from './types';
import { buildSectionsFromFormat } from './buildSectionsFromFormat';
import { getLocalizedDigits, getTimezoneToRender, validateSections } from './utils';
import { TextDirection } from '../../../direction-provider';
import { selectors } from './selectors';
import { mergeDateIntoReferenceDate } from './mergeDateIntoReferenceDate';

const SECTION_TYPE_GRANULARITY: { [key in TemporalFieldSectionType]?: number } = {
  year: 1,
  month: 2,
  day: 3,
  hours: 4,
  minutes: 5,
  seconds: 6,
};

export class TemporalFieldStore<
  TValue extends TemporalSupportedValue,
  TError,
> extends Store<TemporalFieldState> {
  private valueManager: TemporalFieldValueManager<TValue>;

  private parameters: TemporalFieldStoreParameters<TValue, TError>;

  private initialParameters: TemporalFieldStoreParameters<TValue, TError> | null = null;

  constructor(
    parameters: TemporalFieldStoreParameters<TValue, TError>,
    adapter: TemporalAdapter,
    manager: TemporalManager<TValue, TError, any>,
    valueManager: TemporalFieldValueManager<TValue>,
    direction: TextDirection,
  ) {
    const value = parameters.value ?? parameters.defaultValue ?? manager.emptyValue;
    const shouldRespectLeadingZeros = parameters.shouldRespectLeadingZeros ?? false;
    const localizedDigits = getLocalizedDigits(adapter);

    const sections = valueManager.getSectionsFromValue(value, (date) =>
      buildSectionsFromFormat({
        adapter,
        localizedDigits,
        format: parameters.format,
        date,
        shouldRespectLeadingZeros,
        direction,
      }),
    );

    const granularity = Math.max(
      ...sections.map((section) => SECTION_TYPE_GRANULARITY[section.sectionType] ?? 1),
    );

    const referenceValue = valueManager.getInitialReferenceValue({
      referenceDate: parameters.referenceDate,
      value,
      adapter,
      // props: internalPropsWithDefaults as GetDefaultReferenceDateProps,
      granularity,
      timezone: getTimezoneToRender(
        adapter,
        manager,
        value,
        parameters.referenceDate,
        parameters.timezone,
      ),
    });

    validateSections(sections, manager.dateType);

    super({
      value,
      sections,
      timezoneProp: parameters.timezone,
      shouldRespectLeadingZeros,
      referenceDateProp: parameters.referenceDate ?? null,
      format: parameters.format,
      disabled: parameters.disabled ?? false,
      readOnly: parameters.readOnly ?? false,
      direction,
      localizedDigits,
      referenceValue,
      valueManager,
      adapter,
      manager,
      characterQuery: null,
      selectedSections: null,
      tempValueStrAndroid: null,
    });

    this.valueManager = valueManager;
    this.parameters = parameters;

    if (process.env.NODE_ENV !== 'production') {
      this.initialParameters = parameters;
    }
  }

  public clearValue() {
    const { adapter, value } = this.state;
    if (this.valueManager.areValuesEqual(adapter, value, this.valueManager.emptyValue)) {
      this.update({
        sections: this.state.sections.map((section) => ({ ...section, value: '' })),
        tempValueStrAndroid: null,
        characterQuery: null,
      });
    } else {
      this.set('characterQuery', null);
      this.publishValue(this.valueManager.emptyValue);
    }
  }

  public clearActiveSection() {
    const activeSection = selectors.activeSection<TValue>(this.state);
    if (activeSection == null || activeSection.section.value === '') {
      return;
    }

    setSectionUpdateToApplyOnNextInvalidDate('');

    if (activeSection.date === null) {
      this.update({
        sections: activeSection.update(''),
        tempValueStrAndroid: null,
        characterQuery: null,
      });
    } else {
      this.set('characterQuery', null);
      this.publishValue(
        this.valueManager.updateDateInValue(this.state.value, activeSection.section, null),
      );
    }
  }

  public updateValueFromValueStr(valueStr: string) {
    const { adapter, format, localizedDigits, direction, shouldRespectLeadingZeros, valueManager } =
      this.state;
    const parseDateStr = (dateStr: string, referenceDate: TemporalSupportedObject) => {
      const date = adapter.parse(dateStr, format, selectors.timezoneToRender(this.state));
      if (!adapter.isValid(date)) {
        return null;
      }

      const sections = buildSectionsFromFormat({
        adapter,
        localizedDigits,
        format,
        date,
        shouldRespectLeadingZeros,
        direction,
      });
      return mergeDateIntoReferenceDate(adapter, date, sections, referenceDate, false);
    };

    const newValue = valueManager.parseValueStr(valueStr, this.state.referenceValue, parseDateStr);
    this.publishValue(newValue);
  }

  public updateSectionValue({
    section,
    newSectionValue,
    shouldGoToNextSection,
  }: UpdateSectionValueParameters<TValue>) {
    const { valueManager, adapter, referenceValue } = this.state;

    updateSectionValueOnNextInvalidDateTimeout.clear();
    cleanActiveDateSectionsIfValueNullTimeout.clear();

    const activeDate = valueManager.getDateFromSection(value, section);

    /**
     * Decide which section should be focused
     */
    if (shouldGoToNextSection && activeSectionIndex! < state.sections.length - 1) {
      this.setSelectedSections(activeSectionIndex! + 1);
    }

    /**
     * Try to build a valid date from the new section value
     */
    const newSections = setSectionValue(activeSectionIndex!, newSectionValue);
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
        cleanActiveDateSectionsIfValueNullTimeout.start(0, () => {
          if (valueRef.current === value) {
            setState((prevState) => ({
              ...prevState,
              sections: valueManager.clearDateSections(state.sections, section),
              tempValueStrAndroid: null,
            }));
          }
        });
      }

      return this.publishValue(valueManager.updateDateInValue(value, section, mergedDate));
    }

    /**
     * If all the sections are filled but the date is invalid and the previous date is valid or null,
     * Then we publish an invalid date.
     */
    if (
      newActiveDateSections.every((sectionBis) => sectionBis.value !== '') &&
      (activeDate == null || adapter.isValid(activeDate))
    ) {
      setSectionUpdateToApplyOnNextInvalidDate(newSectionValue);
      return this.publishValue(valueManager.updateDateInValue(value, section, newActiveDate));
    }

    /**
     * If the previous date is not null,
     * Then we publish the date as `newActiveDate to prevent error state oscillation`.
     * @link: https://github.com/mui/mui-x/issues/17967
     */
    if (activeDate != null) {
      setSectionUpdateToApplyOnNextInvalidDate(newSectionValue);
      this.publishValue(valueManager.updateDateInValue(value, section, newActiveDate));
    }

    /**
     * If the previous date is already null,
     * Then we don't publish the date and we update the sections.
     */
    return this.update({
      sections: newSections,
      tempValueStrAndroid: null,
    });
  }

  public handleInputKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    const { value, disabled, readOnly, valueManager, localizedDigits, adapter } = this.state;
    const selectedSections = selectors.selectedSections(this.state);
    const activeSection = selectors.activeSection<TValue>(this.state);
    const timezone = selectors.timezoneToRender(this.state);

    if (disabled) {
      return;
    }

    // eslint-disable-next-line default-case
    switch (true) {
      // Select all
      case (event.ctrlKey || event.metaKey) &&
        String.fromCharCode(event.keyCode) === 'A' &&
        !event.shiftKey &&
        !event.altKey: {
        // prevent default to make sure that the next line "select all" while updating
        // the internal state at the same time.
        event.preventDefault();
        this.setSelectedSections('all');
        break;
      }

      // Move selection to next section
      case event.key === 'ArrowRight': {
        event.preventDefault();

        if (selectedSections == null) {
          this.setSelectedSections(sectionOrder.startIndex);
        } else if (selectedSections === 'all') {
          this.setSelectedSections(sectionOrder.endIndex);
        } else {
          const nextSectionIndex = sectionOrder.neighbors[selectedSections].rightIndex;
          if (nextSectionIndex !== null) {
            this.setSelectedSections(nextSectionIndex);
          }
        }
        break;
      }

      // Move selection to previous section
      case event.key === 'ArrowLeft': {
        event.preventDefault();

        if (selectedSections == null) {
          this.setSelectedSections(sectionOrder.endIndex);
        } else if (selectedSections === 'all') {
          this.setSelectedSections(sectionOrder.startIndex);
        } else {
          const nextSectionIndex = sectionOrder.neighbors[selectedSections].leftIndex;
          if (nextSectionIndex !== null) {
            this.setSelectedSections(nextSectionIndex);
          }
        }
        break;
      }

      // Reset the value of the selected section
      case event.key === 'Delete': {
        event.preventDefault();

        if (readOnly) {
          break;
        }

        if (selectedSections == null || selectedSections === 'all') {
          this.clearValue();
        } else {
          this.clearActiveSection();
        }
        break;
      }

      // Increment / decrement the selected section value
      case ['ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key): {
        event.preventDefault();

        if (readOnly || activeSection == null) {
          break;
        }

        // if all sections are selected, mark the currently editing one as selected
        if (selectedSections === 'all') {
          this.setSelectedSections(activeSection.index);
        }

        const newSectionValue = adjustSectionValue(
          adapter,
          timezone,
          activeSection.section,
          event.key as AvailableAdjustKeyCode,
          sectionsValueBoundaries,
          localizedDigits,
          valueManager.getDateFromSection(value, activeSection.section),
          { minutesStep },
        );

        this.updateSectionValue({
          section: activeSection,
          newSectionValue,
          shouldGoToNextSection: false,
        });
        break;
      }
    }
  };

  public handleInputFocus = () => {
    if (focused || disabled || !domGetters.isReady()) {
      return;
    }

    const activeElement = getActiveElement(domGetters.getRoot());

    setFocused(true);

    const isFocusInsideASection = domGetters.getSectionIndexFromDOMElement(activeElement) != null;
    if (!isFocusInsideASection) {
      setSelectedSections(sectionOrder.startIndex);
    }
  };

  public handleInputBlur = () => {
    setTimeout(() => {
      if (!domGetters.isReady()) {
        return;
      }

      const activeElement = getActiveElement(domGetters.getRoot());
      const shouldBlur = !domGetters.getRoot().contains(activeElement);
      if (shouldBlur) {
        setFocused(false);
        setSelectedSections(null);
      }
    });
  };

  private getSectionsFromValue(valueToAnalyze: TValue) {
    const { adapter, shouldRespectLeadingZeros } = this.state;

    return this.valueManager.getSectionsFromValue(valueToAnalyze, (date) =>
      buildSectionsFromFormat({
        date,
        adapter,
        localizedDigits: this.state.localizedDigits,
        format: this.state.format,
        shouldRespectLeadingZeros,
        direction: this.state.direction,
      }),
    );
  }

  private publishValue(value: TValue) {
    const { manager } = this.state;

    const context: TemporalFieldValueChangeHandlerContext<TError> = {
      getValidationError: () => manager.getValidationError(value, this.validationProps),
    };

    // TODO: Fire onValueChange
  }

  private setSelectedSections(selectedSections: TemporalFieldSelectedSections) {
    this.set('selectedSections', selectedSections);
  }
}
