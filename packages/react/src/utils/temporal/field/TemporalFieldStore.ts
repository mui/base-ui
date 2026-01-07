import * as React from 'react';
import { Store } from '@base-ui/utils/store';
import { ownerDocument } from '@base-ui/utils/owner';
import {
  TemporalAdapter,
  TemporalFieldSectionType,
  TemporalSupportedObject,
  TemporalSupportedValue,
} from '../../../types';
import { TemporalManager } from '../types';
import {
  TemporalFieldSection,
  TemporalFieldSelectedSections,
  TemporalFieldState,
  TemporalFieldStoreParameters,
  TemporalFieldValueChangeHandlerContext,
  TemporalFieldValueManager,
} from './types';
import { buildSectionsFromFormat } from './buildSectionsFromFormat';
import {
  DEFAULT_PLACEHOLDER_GETTERS,
  getLocalizedDigits,
  getTimezoneToRender,
  validateSections,
} from './utils';
import { TextDirection } from '../../../direction-provider';
import { selectors } from './selectors';
import { mergeDateIntoReferenceDate } from './mergeDateIntoReferenceDate';
import { activeElement } from '../../../floating-ui-react/utils';
import { TemporalFieldValueAdjustmentPlugin } from './TemporalFieldValueAdjustmentPlugin';

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

  public inputRef = React.createRef<HTMLElement>();

  private valueAdjustment = new TemporalFieldValueAdjustmentPlugin<TValue>(this);

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
      placeholderGetters: { ...parameters.placeholderGetters, ...DEFAULT_PLACEHOLDER_GETTERS },
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
        sections: selectors
          .sections<TValue>(this.state)
          .map((section) => ({ ...section, value: '' })),
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
    const { valueManager, adapter, referenceValue, value, localizedDigits } = this.state;
    const sections = selectors.sections<TValue>(this.state);

    updateSectionValueOnNextInvalidDateTimeout.clear();
    cleanActiveDateSectionsIfValueNullTimeout.clear();

    const activeDate = valueManager.getDateFromSection(value, section);

    /**
     * Decide which section should be focused
     */
    if (shouldGoToNextSection && activeSectionIndex! < sections.length - 1) {
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
            this.update({
              sections: valueManager.clearDateSections(sections, section),
              tempValueStrAndroid: null,
            });
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
    const sections = selectors.sections<TValue>(this.state);
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
          this.setSelectedSections(0);
        } else if (selectedSections === 'all') {
          this.setSelectedSections(sections.length - 1);
        } else if (selectedSections < sections.length - 1) {
          this.setSelectedSections(selectedSections + 1);
        }
        break;
      }

      // Move selection to previous section
      case event.key === 'ArrowLeft': {
        event.preventDefault();

        if (selectedSections == null) {
          this.setSelectedSections(sections.length - 1);
        } else if (selectedSections === 'all') {
          this.setSelectedSections(0);
        } else if (selectedSections > 0) {
          this.setSelectedSections(selectedSections - 1);
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
      case this.valueAdjustment.isAdjustSectionValueKeyCode(event.key): {
        event.preventDefault();

        if (readOnly || activeSection == null) {
          break;
        }

        // if all sections are selected, mark the currently editing one as selected
        if (selectedSections === 'all') {
          this.setSelectedSections(activeSection.index);
        }

        this.updateSectionValue({
          section: activeSection,
          newSectionValue: this.valueAdjustment.adjustActiveSectionValue(event.key),
          shouldGoToNextSection: false,
        });
        break;
      }
    }
  };

  public handleInputFocus = () => {
    const { disabled } = this.state;
    if (focused || disabled || !this.inputRef.current) {
      return;
    }

    const activeEl = this.getActiveElement();

    setFocused(true);

    const isFocusInsideASection = domGetters.getSectionIndexFromDOMElement(activeEl) != null;
    if (!isFocusInsideASection) {
      this.setSelectedSections(0);
    }
  };

  public handleInputBlur = () => {
    setTimeout(() => {
      if (!this.inputRef.current) {
        return;
      }

      const activeEl = this.getActiveElement();
      const shouldBlur = !this.inputRef.current.contains(activeEl);
      if (shouldBlur) {
        setFocused(false);
        this.setSelectedSections(null);
      }
    });
  };

  public handleInputClick = (event: React.MouseEvent) => {
    const { disabled } = this.state;
    const sections = selectors.sections<TValue>(this.state);
    const selectedSections = selectors.selectedSections(this.state);

    if (disabled || !this.inputRef.current) {
      return;
    }

    setFocused(true);

    if (selectedSections === 'all') {
      containerClickTimeout.start(0, () => {
        const cursorPosition = document.getSelection()!.getRangeAt(0).startOffset;

        if (cursorPosition === 0) {
          this.setSelectedSections(0);
          return;
        }

        let sectionIndex = 0;
        let cursorOnStartOfSection = 0;

        while (cursorOnStartOfSection < cursorPosition && sectionIndex < sections.length) {
          const section = sections[sectionIndex];
          sectionIndex += 1;
          cursorOnStartOfSection += `${section.startSeparator}${
            section.value || this.getSectionPlaceholder(section)
          }${section.endSeparator}`.length;
        }

        this.setSelectedSections(sectionIndex - 1);
      });
    } else if (!focused) {
      setFocused(true);
      this.setSelectedSections(0);
    } else {
      const hasClickedOnASection = this.inputRef.current.contains(event.target as Node);

      if (!hasClickedOnASection) {
        this.setSelectedSections(0);
      }
    }
  };

  public handleInputPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const { readOnly } = this.state;
    const selectedSections = selectors.selectedSections(this.state);

    if (readOnly || selectedSections !== 'all') {
      event.preventDefault();
      return;
    }

    const pastedValue = event.clipboardData.getData('text');
    event.preventDefault();
    setCharacterQuery(null);
    this.updateValueFromValueStr(pastedValue);
  };

  public handleInputInput = (event: React.FormEvent<HTMLDivElement>) => {
    const selectedSections = selectors.selectedSections(this.state);
    const sections = selectors.sections<TValue>(this.state);

    if (!this.inputRef.current || selectedSections !== 'all') {
      return;
    }

    const target = event.target as HTMLSpanElement;
    const keyPressed = target.textContent ?? '';

    this.inputRef.current.innerHTML = sections
      .map(
        (section) =>
          `${section.startSeparator}${section.value || this.getSectionPlaceholder(section)}${section.endSeparator}`,
      )
      .join('');
    syncSelectionToDOM({ focused, domGetters, stateResponse });

    if (keyPressed.length === 0 || keyPressed.charCodeAt(0) === 10) {
      this.clearValue();
      this.setSelectedSections('all');
    } else if (keyPressed.length > 1) {
      this.updateValueFromValueStr(keyPressed);
    } else {
      if (selectedSections === 'all') {
        this.setSelectedSections(0);
      }
      applyCharacterEditing({
        keyPressed,
        sectionIndex: 0,
      });
    }
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

  private getSectionPlaceholder(section: TemporalFieldSection<TValue>) {
    const { adapter, placeholderGetters } = this.state;
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

  private getActiveElement() {
    const doc = ownerDocument(this.inputRef.current);
    return activeElement(doc);
  }
}
