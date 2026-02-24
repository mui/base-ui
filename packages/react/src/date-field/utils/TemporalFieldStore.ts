import * as React from 'react';
import { createSelectorMemoized, ReactStore } from '@base-ui/utils/store';
import { warn } from '@base-ui/utils/warn';
import { ownerDocument } from '@base-ui/utils/owner';
import { TimeoutManager } from '@base-ui/utils/TimeoutManager';
import {
  TemporalFieldDatePartType,
  TemporalNonNullableValue,
  TemporalSupportedObject,
  TemporalSupportedValue,
} from '../../types';
import {
  AdjustDatePartValueKeyCode,
  EditSectionParameters,
  TemporalFieldQueryApplier,
  TemporalFieldParsedFormat,
  TemporalFieldState,
  TemporalFieldStoreParameters,
  TemporalFieldConfiguration,
  TemporalFieldRootActions,
  TemporalFieldCharacterEditingQuery,
  TemporalFieldDatePart,
  TemporalFieldSection,
  TemporalFieldToken,
  TemporalFieldValueChangeEventDetails,
  UpdateDatePartParameters,
} from './types';
import { FormatParser } from './formatParser';
import {
  alignToStep,
  buildSections,
  deriveStateFromParameters,
  getAdjustmentDelta,
  getDirection,
  getTimezoneToRender,
  applyLocalizedDigits,
  cleanDigitDatePartValue,
  getLetterEditingOptions,
  isDatePart,
  isToken,
  isDecrementDirection,
  isIncrementDirection,
  isQueryResponseWithoutValue,
  isStringNumber,
  mergeDateIntoReferenceDate,
  removeLocalizedDigits,
  wrapInRange,
} from './utils';
import { selectors } from './selectors';
import { getLocalizedDigits, getWeekDaysStr } from './adapter-cache';
import { activeElement } from '../../floating-ui-react/utils';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';

function validateParsedFormat(dateType: string, parsedFormat: TemporalFieldParsedFormat) {
  if (process.env.NODE_ENV !== 'production') {
    const supportedSections: TemporalFieldDatePartType[] = [];
    if (['date', 'date-time'].includes(dateType)) {
      supportedSections.push('weekDay', 'day', 'month', 'year');
    }
    if (['time', 'date-time'].includes(dateType)) {
      supportedSections.push('hours', 'minutes', 'seconds', 'meridiem');
    }

    const invalidDatePartEl = parsedFormat.elements.find(
      (element) => isToken(element) && !supportedSections.includes(element.config.part),
    ) as TemporalFieldToken | undefined;

    if (invalidDatePartEl) {
      warn(
        `Base UI: The field component you are using is not compatible with the "${invalidDatePartEl.config.part}" date section.`,
        `The supported date parts are ["${supportedSections.join('", "')}"].`,
      );
    }
  }
}

const LETTERS_ONLY_REGEX = /^[a-zA-Z]+$/;
const DIGITS_ONLY_REGEX = /^[0-9]+$/;
const DIGITS_AND_LETTER_REGEX = /^(?:[a-zA-Z]+)?[0-9]+(?:[a-zA-Z]+)?$/;

export interface TemporalFieldStoreContext<TValue extends TemporalSupportedValue> {
  onValueChange?:
    | ((value: TValue, eventDetails: TemporalFieldValueChangeEventDetails) => void)
    | undefined;
}

export class TemporalFieldStore<TValue extends TemporalSupportedValue> extends ReactStore<
  TemporalFieldState<TValue>,
  TemporalFieldStoreContext<TValue>,
  typeof selectors
> {
  private timeoutManager = new TimeoutManager();

  private sectionToUpdateOnNextInvalidDate: { index: number; value: string } | null = null;

  private sectionElementMap = new Map<number, HTMLElement>();

  /**
   * Duration in milliseconds before the character query is cleared.
   * After this time without a new keystroke, the accumulated query (e.g., "1" waiting for "12") is discarded.
   */
  private static queryLifeDuration = 5000;

  private static adjustKeyCodes: Set<AdjustDatePartValueKeyCode> = new Set([
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
    'PageUp',
    'PageDown',
  ]);

  constructor(
    parameters: TemporalFieldStoreParameters<TValue>,
    config: TemporalFieldConfiguration<TValue>,
  ) {
    const { adapter, direction } = parameters;
    const manager = config.getManager(adapter);
    const value = parameters.value ?? parameters.defaultValue ?? manager.emptyValue;
    const validationProps = { minDate: parameters.minDate, maxDate: parameters.maxDate };

    const derivedState = deriveStateFromParameters(parameters, config);

    const parsedFormat = FormatParser.parse(
      adapter,
      parameters.format,
      direction,
      derivedState.translations,
      validationProps,
    );
    validateParsedFormat(manager.dateType, parsedFormat);

    const referenceValue = config.getInitialReferenceValue({
      externalReferenceDate: parameters.referenceDate,
      value,
      adapter,
      validationProps,
      granularity: parsedFormat.granularity,
      timezone: getTimezoneToRender(
        adapter,
        manager,
        value,
        parameters.referenceDate,
        parameters.timezone,
      ),
    });

    const sections = config.getSectionsFromValue(value, (date) =>
      buildSections(adapter, parsedFormat, date),
    );

    const inputRef = React.createRef<HTMLElement>();

    super(
      {
        ...deriveStateFromParameters(parameters, config),
        manager,
        value,
        sections,
        referenceValue,
        format: parsedFormat,
        characterQuery: null,
        selectedSection: null,
        inputRef,
      },
      { onValueChange: parameters.onValueChange },
      selectors,
    );

    // Character query sync
    this.registerStoreEffect(
      createSelectorMemoized(
        selectors.characterQuery,
        selectors.sections,
        selectors.activeDatePart,
        (characterQuery, sectionsList, activeSection) => ({
          characterQuery,
          sections: sectionsList,
          activeSection,
        }),
      ),
      (_, { characterQuery, sections: sectionsList, activeSection }) => {
        if (characterQuery == null) {
          return;
        }

        const querySection = sectionsList[characterQuery.sectionIndex];

        const shouldReset =
          (isDatePart(querySection) && querySection.token.config.part !== characterQuery.part) ||
          activeSection == null; /* && error != null */ // TODO: Support error state

        if (shouldReset) {
          this.set('characterQuery', null);
        }
      },
    );

    // Filled state sync when value changes
    this.registerStoreEffect(
      (state) => state.value,
      (_previousValue, nextValue) => {
        const fieldContext = this.state.fieldContext;
        if (fieldContext) {
          fieldContext.setFilled(nextValue !== null);
        }
      },
    );

    // Format / sections / manager derivation effect
    // When format-related props change, re-parse the format and rebuild sections.
    this.registerStoreEffect(
      createSelectorMemoized(
        (state: TemporalFieldState<TValue>) => state.rawFormat,
        (state: TemporalFieldState<TValue>) => state.adapter,
        (state: TemporalFieldState<TValue>) => state.direction,
        (state: TemporalFieldState<TValue>) => state.translations,
        (state: TemporalFieldState<TValue>) => state.minDate,
        (state: TemporalFieldState<TValue>) => state.maxDate,
        (rawFormat, adapterVal, directionVal, translationsVal, minDateVal, maxDateVal) => ({
          rawFormat,
          adapter: adapterVal,
          direction: directionVal,
          translations: translationsVal,
          minDate: minDateVal,
          maxDate: maxDateVal,
        }),
      ),
      (previous, next) => {
        // createSelectorMemoized may return a new object reference even when all input
        // values are identical (due to its per-state-object __cacheKey__ mechanism).
        // Guard against this to avoid infinite recursion when this.update() is called below.
        if (
          previous.rawFormat === next.rawFormat &&
          previous.adapter === next.adapter &&
          previous.direction === next.direction &&
          previous.translations === next.translations &&
          previous.minDate === next.minDate &&
          previous.maxDate === next.maxDate
        ) {
          return;
        }

        const currentConfig = this.state.config;

        const nextParsedFormat = FormatParser.parse(
          next.adapter,
          next.rawFormat,
          next.direction,
          next.translations,
          { minDate: next.minDate, maxDate: next.maxDate },
        );
        validateParsedFormat(this.state.manager.dateType, nextParsedFormat);

        const newSections = currentConfig.getSectionsFromValue(this.state.value, (date) =>
          buildSections(next.adapter, nextParsedFormat, date),
        );

        this.sectionToUpdateOnNextInvalidDate = null;

        const newState: Partial<TemporalFieldState<TValue>> = {
          format: nextParsedFormat,
          sections: newSections,
        };

        if (next.adapter !== previous.adapter) {
          newState.manager = currentConfig.getManager(next.adapter);
        }

        this.update(newState);
      },
    );

    // Controlled value sync effect
    // When valueProp changes (controlled mode), sync value and rebuild sections/referenceValue.
    this.registerStoreEffect(
      (state: TemporalFieldState<TValue>) => state.valueProp,
      (previousValueProp, nextValueProp) => {
        if (nextValueProp === undefined) {
          return;
        }

        const newState: Partial<TemporalFieldState<TValue>> = {
          value: nextValueProp,
        };

        if (nextValueProp !== previousValueProp) {
          Object.assign(newState, this.deriveStateFromNewValue(nextValueProp));
        }

        this.update(newState);
      },
    );
  }

  /**
   * Returns imperative actions that can be exposed via actionsRef.
   */
  public getActions(): TemporalFieldRootActions {
    return {
      clear: () => this.clear(),
    };
  }

  public mountEffect = () => {
    // Sync selection to DOM on mount and whenever the selected section changes.
    this.syncSelectionToDOM();
    const unsubscribe = this.registerStoreEffect(
      selectors.selectedSection,
      this.syncSelectionToDOM,
    );

    return () => {
      unsubscribe();
      this.timeoutManager.clearAll();
    };
  };

  /**
   * Publishes the provided field value.
   */
  public publish(value: TValue) {
    const inputTimezone = this.state.manager.getTimezone(this.state.value);
    const newValueWithInputTimezone =
      inputTimezone == null ? value : this.state.manager.setTimezone(value, inputTimezone);

    const eventDetails: TemporalFieldValueChangeEventDetails = createChangeEventDetails(
      'none',
      undefined,
      undefined,
    );

    this.context.onValueChange?.(newValueWithInputTimezone, eventDetails);
    if (!eventDetails.isCanceled && this.state.valueProp === undefined) {
      this.update({
        value: newValueWithInputTimezone,
        ...this.deriveStateFromNewValue(newValueWithInputTimezone),
      });
    }

    // Update Field context state (dirty, validation)
    const fieldContext = this.state.fieldContext;
    if (fieldContext) {
      // Set dirty state by comparing with initial value
      fieldContext.setDirty(
        !this.state.manager.areValuesEqual(
          newValueWithInputTimezone,
          fieldContext.validityData.initialValue as TValue,
        ),
      );

      // Validate if needed (call without await - async validation doesn't block)
      if (fieldContext.shouldValidateOnChange()) {
        fieldContext.validation.commit(newValueWithInputTimezone);
      }
    }
  }

  /**
   * Updates the value from its string representation.
   */
  public updateFromString(valueStr: string) {
    const adapter = selectors.adapter(this.state);
    const fieldConfig = selectors.config(this.state);
    const format = selectors.format(this.state);

    let invalidValue = false;
    const parseDateStr = (dateStr: string, referenceDate: TemporalSupportedObject) => {
      const date = adapter.parse(
        dateStr,
        this.state.rawFormat,
        selectors.timezoneToRender(this.state),
      );
      if (!adapter.isValid(date)) {
        invalidValue = true;
        return null;
      }

      const sectionsList = buildSections(adapter, format, date);
      return mergeDateIntoReferenceDate(date, sectionsList, referenceDate, false);
    };

    const newValue = fieldConfig.parseValueStr(valueStr, this.state.referenceValue, parseDateStr);
    if (!invalidValue) {
      this.publish(newValue);
    }
  }

  /**
   * Clears the field value.
   * If the value is already empty, it clears the sections.
   */
  public clear() {
    const manager = selectors.manager(this.state);
    const currentValue = selectors.value(this.state);

    if (manager.areValuesEqual(currentValue, manager.emptyValue)) {
      const emptySections = selectors
        .sections(this.state)
        .map((section) => (isDatePart(section) ? { ...section, value: '' } : section));

      this.update({
        sections: emptySections,
        characterQuery: null,
      });
      this.selectClosestDatePart(0);
    } else {
      this.update({
        characterQuery: null,
      });
      this.selectClosestDatePart(0);
      this.publish(manager.emptyValue);
    }
  }

  /**
   * Generates the sections and the reference value from a new value.
   */
  public deriveStateFromNewValue(newValue: TValue) {
    const adapter = selectors.adapter(this.state);
    const config = selectors.config(this.state);
    const format = selectors.format(this.state);
    const sectionsBefore = selectors.sections(this.state);
    const referenceValueBefore = selectors.referenceValue(this.state);
    const sectionToUpdate = this.sectionToUpdateOnNextInvalidDate;

    const isActiveDateInvalid =
      sectionToUpdate != null &&
      !adapter.isValid(config.getDateFromSection(newValue, sectionsBefore[sectionToUpdate.index]));
    let sectionsList: TemporalFieldSection[];
    if (isActiveDateInvalid) {
      sectionsList = TemporalFieldStore.replaceDatePartValueInSectionList(
        sectionsBefore,
        sectionToUpdate.index,
        sectionToUpdate.value,
      );
    } else {
      sectionsList = config.getSectionsFromValue(newValue, (date) =>
        buildSections(adapter, format, date),
      );
    }

    return {
      sections: sectionsList,
      referenceValue: (isActiveDateInvalid
        ? referenceValueBefore
        : config.updateReferenceValue(
            adapter,
            newValue,
            referenceValueBefore,
          )) as TemporalNonNullableValue<TValue>,
    };
  }

  /**
   * Clears the value of the active section.
   */
  public clearActive() {
    const currentValue = selectors.value(this.state);
    const config = selectors.config(this.state);
    const activeDatePart = selectors.activeDatePart(this.state);
    const sectionsList = selectors.sections(this.state);
    if (activeDatePart == null || activeDatePart.value === '') {
      return;
    }

    this.setSectionUpdateToApplyOnNextInvalidDate(activeDatePart.index, '');

    if (config.getDateFromSection(currentValue, activeDatePart) === null) {
      this.update({
        sections: TemporalFieldStore.replaceDatePartValueInSectionList(
          sectionsList,
          activeDatePart.index,
          '',
        ),
        characterQuery: null,
      });
    } else {
      this.resetCharacterQuery();
      this.publish(config.updateDateInValue(currentValue, activeDatePart, null));
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
  }: UpdateDatePartParameters) {
    const currentValue = selectors.value(this.state);
    const fieldConfig = selectors.config(this.state);
    const refValue = selectors.referenceValue(this.state);
    const adapter = selectors.adapter(this.state);
    const dp = selectors.datePart(this.state, sectionIndex);
    if (dp == null) {
      return undefined;
    }

    const sectionsList = selectors.sections(this.state);

    this.timeoutManager.clearTimeout('updateSectionValueOnNextInvalidDate');
    this.timeoutManager.clearTimeout('cleanActiveDateSectionsIfValueNull');

    const activeDate = fieldConfig.getDateFromSection(currentValue, dp);

    /**
     * Decide which section should be focused
     */
    if (shouldGoToNextSection) {
      this.selectRightDatePart();
    }

    /**
     * Try to build a valid date from the new section value
     */
    const newSections = TemporalFieldStore.replaceDatePartValueInSectionList(
      sectionsList,
      sectionIndex,
      newDatePartValue,
    );
    const newActiveDateSections = fieldConfig.getDateSectionsFromValue(newSections, dp);
    const newActiveDate = this.getDateFromDateSections(newActiveDateSections);

    /**
     * If the new date is valid,
     * Then we merge the value of the modified sections into the reference date.
     * This makes sure that we don't lose some information of the initial date (like the time on a date field).
     */
    if (adapter.isValid(newActiveDate)) {
      const mergedDate = mergeDateIntoReferenceDate(
        newActiveDate,
        newActiveDateSections,
        fieldConfig.getDateFromSection(refValue as any, dp)!,
        true,
      );

      if (activeDate == null) {
        this.timeoutManager.startTimeout('cleanActiveDateSectionsIfValueNull', 0, () => {
          if (this.state.value === currentValue) {
            this.set('sections', fieldConfig.clearDateSections(sectionsList, dp));
          }
        });
      }

      return this.publish(fieldConfig.updateDateInValue(currentValue, dp, mergedDate));
    }

    /**
     * If all the sections are filled but the date is invalid and the previous date is valid or null,
     * Then we publish an invalid date.
     */
    if (
      newActiveDateSections.every((section) => section.value !== '') &&
      (activeDate == null || adapter.isValid(activeDate))
    ) {
      this.setSectionUpdateToApplyOnNextInvalidDate(sectionIndex, newDatePartValue);
      return this.publish(fieldConfig.updateDateInValue(currentValue, dp, newActiveDate));
    }

    /**
     * If the previous date is not null,
     * Then we publish the date as `newActiveDate` to prevent error state oscillation.
     * Note: intentionally falls through to `set('sections', ...)` below,
     * which overrides the sections derived by `publish` to keep the user-typed values.
     * @link: https://github.com/mui/mui-x/issues/17967
     */
    if (activeDate != null) {
      this.setSectionUpdateToApplyOnNextInvalidDate(sectionIndex, newDatePartValue);
      this.publish(fieldConfig.updateDateInValue(currentValue, dp, newActiveDate));
    }

    /**
     * Update the sections with the new values.
     * This runs in both cases (activeDate null or not):
     * - When `activeDate` is null, this is the only update (no publish).
     * - When `activeDate` is not null, this overrides the sections derived from the published
     *   invalid date to keep the section values the user actually typed.
     */
    return this.set('sections', newSections);
  }

  public selectClosestDatePart(sectionIndex: number) {
    const sectionsList = selectors.sections(this.state);

    // First, try to find a date part by searching backward
    let closestIndex = this.getAdjacentDatePartIndex(sectionsList, sectionIndex, -1);

    // If we didn't find a date part searching backward, search forward
    if (closestIndex == null) {
      closestIndex = this.getAdjacentDatePartIndex(sectionsList, sectionIndex, 1);
    }

    if (closestIndex != null) {
      this.set('selectedSection', closestIndex);
    }
  }

  public selectRightDatePart() {
    const selected = selectors.selectedSection(this.state);
    if (selected == null) {
      return;
    }

    const sectionsList = selectors.sections(this.state);
    const nextIndex = this.getAdjacentDatePartIndex(sectionsList, selected + 1, 1);
    if (nextIndex != null) {
      this.set('selectedSection', nextIndex);
    }
  }

  public selectLeftDatePart() {
    const selected = selectors.selectedSection(this.state);
    if (selected == null) {
      return;
    }

    const sectionsList = selectors.sections(this.state);
    const previousIndex = this.getAdjacentDatePartIndex(sectionsList, selected - 1, -1);
    if (previousIndex != null) {
      this.set('selectedSection', previousIndex);
    }
  }

  public removeSelectedSection() {
    this.set('selectedSection', null);
  }

  private resetCharacterQuery() {
    this.setCharacterQuery(null);
  }

  public editSection(parameters: EditSectionParameters) {
    const { keyPressed, sectionIndex } = parameters;
    const localizedDigits = getLocalizedDigits(selectors.adapter(this.state));
    const response = isStringNumber(keyPressed, localizedDigits)
      ? this.applyNumericEditing(parameters)
      : this.applyLetterEditing(parameters);
    if (response == null) {
      return;
    }

    this.updateDatePart({
      sectionIndex,
      newDatePartValue: response.datePartValue,
      shouldGoToNextSection: response.shouldGoToNextSection,
    });
  }

  public isAdjustSectionValueKeyCode(keyCode: string): keyCode is AdjustDatePartValueKeyCode {
    return TemporalFieldStore.adjustKeyCodes.has(keyCode as AdjustDatePartValueKeyCode);
  }

  /**
   * Adjusts the value of the active section based on the provided key code.
   * For example, pressing ArrowUp will increment the section's value.
   */
  public adjustActiveDatePartValue(keyCode: AdjustDatePartValueKeyCode, sectionIndex: number) {
    if (!selectors.editable(this.state)) {
      return;
    }

    this.updateDatePart({
      sectionIndex,
      newDatePartValue: this.getAdjustedDatePartValue(keyCode, sectionIndex),
      shouldGoToNextSection: false,
    });
  }

  public registerSection = (sectionElement: HTMLDivElement | null) => {
    if (sectionElement == null) {
      return undefined;
    }

    const index = this.getSectionIndexFromDOMElement(sectionElement);
    if (index == null) {
      return undefined;
    }

    this.sectionElementMap.set(index, sectionElement);
    return () => this.sectionElementMap.delete(index);
  };

  public readonly rootEventHandlers = {
    onClick: () => {
      if (selectors.disabled(this.state) || !this.state.inputRef.current) {
        return;
      }

      if (!this.isFocused() && selectors.selectedSection(this.state) == null) {
        this.selectClosestDatePart(0);
      }
    },
  };

  public readonly hiddenInputEventHandlers = {
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      // Workaround for https://github.com/facebook/react/issues/9023
      if (event.nativeEvent.defaultPrevented) {
        return;
      }

      this.updateFromString(event.target.value);
    },
    onFocus: () => {
      this.selectClosestDatePart(0);
    },
  };

  public readonly clearEventHandlers = {
    onMouseDown: (event: React.MouseEvent) => {
      // Prevent focus stealing from the input
      event.preventDefault();
    },
    onClick: () => {
      if (selectors.disabled(this.state) || selectors.readOnly(this.state)) {
        return;
      }

      this.clear();
      this.state.inputRef.current?.focus();
    },
  };

  public readonly sectionEventHandlers = {
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      // The click event on the clear button would propagate to the input, trigger this handler and result in a wrong section selection.
      // We avoid this by checking if the call to this function is actually intended, or a side effect.
      if (selectors.disabled(this.state) || event.isDefaultPrevented()) {
        return;
      }

      const sectionIndex = this.getSectionIndexFromDOMElement(event.target as HTMLElement);
      if (sectionIndex == null) {
        return;
      }
      this.selectClosestDatePart(sectionIndex);
    },

    onInput: (event: React.FormEvent) => {
      const target = event.target as HTMLSpanElement;
      const keyPressed = target.textContent ?? '';
      const sectionIndex = this.getSectionIndexFromDOMElement(target);
      if (sectionIndex == null) {
        return;
      }

      if (selectors.editable(this.state)) {
        const section = selectors.datePart(this.state, sectionIndex);
        if (section != null) {
          if (keyPressed.length === 0) {
            const inputType = (event.nativeEvent as InputEvent).inputType;
            if (
              section.value !== '' &&
              inputType !== 'insertParagraph' &&
              inputType !== 'insertLineBreak'
            ) {
              this.clearActive();
            }
          } else {
            this.editSection({ keyPressed, sectionIndex });
          }
        }
      }

      // The DOM value needs to remain the one React is expecting.
      this.syncDatePartContentToDOM(sectionIndex);
    },

    onPaste: (event: React.ClipboardEvent) => {
      // prevent default to avoid the input `onInput` handler being called
      event.preventDefault();

      const sectionIndex = this.getSectionIndexFromDOMElement(event.target as HTMLElement);
      if (!selectors.editable(this.state) || sectionIndex == null) {
        return;
      }

      const section = selectors.datePart(this.state, sectionIndex);
      if (section == null) {
        return;
      }

      const pastedValue = event.clipboardData.getData('text');
      const contentType = section.token.config.contentType;
      const isValidPastedValue =
        (contentType === 'letter' && LETTERS_ONLY_REGEX.test(pastedValue)) ||
        (contentType === 'digit' && DIGITS_ONLY_REGEX.test(pastedValue)) ||
        (contentType === 'digit-with-letter' && DIGITS_AND_LETTER_REGEX.test(pastedValue));

      if (isValidPastedValue) {
        this.resetCharacterQuery();
        this.updateDatePart({
          sectionIndex,
          newDatePartValue: pastedValue,
          shouldGoToNextSection: true,
        });
      } else {
        this.resetCharacterQuery();
        this.updateFromString(pastedValue);
      }
    },

    onKeyDown: (event: React.KeyboardEvent<HTMLSpanElement>) => {
      if (selectors.disabled(this.state)) {
        return;
      }

      const sectionIndex = this.getSectionIndexFromDOMElement(event.target as HTMLElement);
      if (sectionIndex == null) {
        return;
      }

      // eslint-disable-next-line default-case
      switch (true) {
        // Move selection to the section on the right
        case event.key === 'ArrowRight': {
          event.preventDefault();
          this.selectRightDatePart();
          break;
        }

        // Move selection to the section on the left
        case event.key === 'ArrowLeft': {
          event.preventDefault();
          this.selectLeftDatePart();
          break;
        }

        // Reset the value of the current section
        case event.key === 'Delete': {
          event.preventDefault();

          if (!selectors.editable(this.state)) {
            break;
          }

          this.updateDatePart({
            sectionIndex,
            newDatePartValue: '',
            shouldGoToNextSection: false,
          });
          break;
        }

        // Increment / decrement the current section value
        case this.isAdjustSectionValueKeyCode(event.key): {
          event.preventDefault();
          this.adjustActiveDatePartValue(event.key, sectionIndex);
          break;
        }
      }
    },

    onMouseUp: (event: React.MouseEvent) => {
      // Without this, the browser will remove the selected when clicking inside an already-selected section.
      event.preventDefault();
    },

    onDragOver: (event: React.DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'none';
    },

    onFocus: (event: React.FocusEvent) => {
      if (selectors.disabled(this.state)) {
        return;
      }

      const sectionIndex = this.getSectionIndexFromDOMElement(event.target);
      if (sectionIndex == null) {
        return;
      }
      this.selectClosestDatePart(sectionIndex);
    },

    onBlur: () => {
      // Defer to next tick to check if focus moved to another section
      this.timeoutManager.startTimeout('blur-detection', 0, () => {
        const activeEl = this.getActiveElement();
        const newSectionIndex = this.getSectionIndexFromDOMElement(activeEl);

        // If focus didn't move to another section in this field, clear selection
        if (newSectionIndex == null || !this.state.inputRef.current?.contains(activeEl)) {
          this.removeSelectedSection();
        }
      });
    },
  };

  /**
   * Registers an effect to be run when the value returned by the selector changes.
   */
  private registerStoreEffect = <Value>(
    selector: (state: TemporalFieldState<TValue>) => Value,
    effect: (previous: Value, next: Value) => void,
  ) => {
    let previousValue = selector(this.state);

    return this.subscribe((state) => {
      const nextValue = selector(state);
      if (nextValue !== previousValue) {
        // Update previousValue before calling the effect so that re-entrant
        // setState calls (from this.update() inside the effect) see the
        // already-updated reference and can compare correctly.
        const prev = previousValue;
        previousValue = nextValue;
        effect(prev, nextValue);
      }
    });
  };

  private getDatePartRenderedValue(datePart: TemporalFieldDatePart) {
    return datePart.value || datePart.token.placeholder;
  }

  /**
   * Updates the content of a section in the DOM to match the store state.
   * This is needed to revert unwanted change made when the section has contentEditable enabled.
   */
  private syncDatePartContentToDOM(sectionIndex: number) {
    const sectionElement = this.getSectionElement(sectionIndex);
    const datePart = selectors.datePart(this.state, sectionIndex);
    if (sectionElement == null || datePart == null) {
      return;
    }

    sectionElement.textContent = this.getDatePartRenderedValue(datePart);
    this.syncSelectionToDOM();
  }

  private syncSelectionToDOM = () => {
    if (!this.state.inputRef.current) {
      return;
    }

    const selection = ownerDocument(this.state.inputRef.current).getSelection();
    if (!selection) {
      return;
    }

    const selected = selectors.selectedSection(this.state);
    if (selected == null) {
      // If the selection contains an element inside the field, we reset it.
      if (
        selection.rangeCount > 0 &&
        // Firefox can return a Restricted object here
        selection.getRangeAt(0).startContainer instanceof Node &&
        this.state.inputRef.current.contains(selection.getRangeAt(0).startContainer)
      ) {
        selection.removeAllRanges();
      }

      return;
    }

    const range = new window.Range();
    const target = this.getSectionElement(selected);
    if (target == null) {
      return;
    }

    range.selectNodeContents(target);
    target.focus();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  private getSectionElement(sectionIndex: number) {
    return this.sectionElementMap.get(sectionIndex) ?? null;
  }

  private getAdjustedDatePartValue(keyCode: AdjustDatePartValueKeyCode, sectionIndex: number) {
    const adapter = selectors.adapter(this.state);
    const validationProps = selectors.validationProps(this.state);
    const datePart = selectors.datePart(this.state, sectionIndex);
    if (datePart == null) {
      return '';
    }

    // When initializing the year and there is no validation boundary in the direction we are going,
    // we set the section to the current year instead of the structural boundary.
    const isYearInitialization = datePart.value === '' && datePart.token.config.part === 'year';
    const hasNoBoundaryInDirection =
      (isDecrementDirection(keyCode) && validationProps.maxDate == null) ||
      (isIncrementDirection(keyCode) && validationProps.minDate == null);
    if (isYearInitialization && hasNoBoundaryInDirection) {
      const timezone = selectors.timezoneToRender(this.state);
      return adapter.formatByString(adapter.now(timezone), datePart.token.value);
    }

    const step = datePart.token.isMostGranularPart ? selectors.step(this.state) : 1;
    const delta = getAdjustmentDelta(keyCode, datePart.value);
    const direction = getDirection(keyCode);
    const contentType = datePart.token.config.contentType;

    if (contentType === 'digit' || contentType === 'digit-with-letter') {
      return this.getAdjustedDigitPartValue(datePart, delta, direction, step);
    }

    return this.getAdjustedLetterPartValue(datePart, delta, direction, step);
  }

  private getAdjustedDigitPartValue(
    dp: TemporalFieldDatePart,
    delta: number | 'boundary',
    direction: 'up' | 'down',
    step: number,
  ) {
    const adapter = selectors.adapter(this.state);
    const localizedDigits = getLocalizedDigits(adapter);
    const boundaries = dp.token.boundaries.adjustment;

    const formatValue = (val: number) =>
      cleanDigitDatePartValue(adapter, val, localizedDigits, dp.token);

    let newValue: number;

    if (delta === 'boundary') {
      newValue = direction === 'up' ? boundaries.minimum : boundaries.maximum;
    } else {
      const currentValue = parseInt(removeLocalizedDigits(dp.value, localizedDigits), 10);
      newValue = currentValue + delta * step;

      // Align to step boundary if needed
      if (step > 1 && newValue % step !== 0) {
        newValue = alignToStep(newValue, step, direction);
      }
    }

    return formatValue(wrapInRange(newValue, boundaries.minimum, boundaries.maximum));
  }

  private getAdjustedLetterPartValue(
    dp: TemporalFieldDatePart,
    delta: number | 'boundary',
    direction: 'up' | 'down',
    stepVal: number,
  ) {
    const adapter = selectors.adapter(this.state);

    const options = getLetterEditingOptions(adapter, dp.token.config.part, dp.token.value);

    if (options.length === 0) {
      return dp.value;
    }

    if (delta === 'boundary') {
      return direction === 'up' ? options[0] : options[options.length - 1];
    }

    const currentIndex = options.indexOf(dp.value);
    const newIndex = (currentIndex + delta * stepVal) % options.length;
    // Handle negative modulo (JS returns negative for negative dividend)
    const wrappedIndex = (newIndex + options.length) % options.length;

    return options[wrappedIndex];
  }

  private getActiveElement() {
    const doc = ownerDocument(this.state.inputRef.current);
    return activeElement(doc);
  }

  private getSectionIndexFromDOMElement(element: Element | null | undefined) {
    if (element == null) {
      return null;
    }

    const indexStr = (element as HTMLElement).dataset?.sectionIndex;
    if (indexStr == null) {
      return null;
    }

    return Number(indexStr);
  }

  private isFocused() {
    return !!this.state.inputRef.current?.contains(this.getActiveElement());
  }

  private getAdjacentDatePartIndex(
    sectionsList: TemporalFieldSection[],
    startIndex: number,
    direction: 1 | -1,
  ): number | null {
    let index = startIndex;
    while (index >= 0 && index < sectionsList.length && !isDatePart(sectionsList[index])) {
      index += direction;
    }

    if (index >= 0 && index < sectionsList.length) {
      return index;
    }

    return null;
  }

  private static replaceDatePartValueInSectionList(
    sectionsList: TemporalFieldSection[],
    sectionIndex: number,
    newDatePartValue: string,
  ) {
    const newSections = [...sectionsList];
    newSections[sectionIndex] = {
      ...(newSections[sectionIndex] as TemporalFieldDatePart),
      value: newDatePartValue,
      modified: true,
    };

    return newSections;
  }

  /**
   * Some date libraries like `dayjs` don't support parsing from date with escaped characters.
   * To make sure that the parsing works, we are building a format and a date without any separator.
   */
  private getDateFromDateSections(sectionsList: TemporalFieldSection[]) {
    const adapter = selectors.adapter(this.state);
    const timezone = selectors.timezoneToRender(this.state);

    // If we have both a day and a weekDay section,
    // Then we skip the weekDay in the parsing because libraries like dayjs can't parse complicated formats containing a weekDay.
    // dayjs(dayjs().format('dddd MMMM D YYYY'), 'dddd MMMM D YYYY')) // returns `Invalid Date` even if the format is valid.
    const shouldSkipWeekDays = sectionsList.some(
      (section) => isDatePart(section) && section.token.config.part === 'day',
    );

    const sectionFormats: string[] = [];
    const sectionValues: string[] = [];
    for (let i = 0; i < sectionsList.length; i += 1) {
      const section = sectionsList[i];

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
    this.timeoutManager.startTimeout('updateSectionValueOnNextInvalidDate', 0, () => {
      this.sectionToUpdateOnNextInvalidDate = null;
    });
  };

  private applyLetterEditing(parameters: EditSectionParameters) {
    const adapter = selectors.adapter(this.state);

    const findMatchingOptions = (
      _format: string,
      options: string[],
      queryValue: string,
    ): ReturnType<TemporalFieldQueryApplier> => {
      const matchingValues = options.filter((option) =>
        option.toLowerCase().startsWith(queryValue),
      );

      if (matchingValues.length === 0) {
        return { saveQuery: false };
      }

      return {
        datePartValue: matchingValues[0],
        shouldGoToNextSection: matchingValues.length === 1,
      };
    };

    const testQueryOnFormatAndFallbackFormat = (
      queryValue: string,
      token: TemporalFieldToken,
      fallbackFormat?: string,
      formatFallbackValue?: (fallbackValue: string, fallbackOptions: string[]) => string,
    ) => {
      const getOptions = (fmt: string) => getLetterEditingOptions(adapter, token.config.part, fmt);

      if (token.config.contentType === 'letter') {
        return findMatchingOptions(token.value, getOptions(token.value), queryValue);
      }

      // When editing a digit-format month / weekDay and the user presses a letter,
      // We can support the letter editing by using the letter-format month / weekDay and re-formatting the result.
      // We just have to make sure that the default month / weekDay format is a letter format,
      if (
        fallbackFormat &&
        formatFallbackValue != null &&
        FormatParser.getTokenConfig(adapter, fallbackFormat).contentType === 'letter'
      ) {
        const fallbackOptions = getOptions(fallbackFormat);
        const response = findMatchingOptions(fallbackFormat, fallbackOptions, queryValue);
        if (isQueryResponseWithoutValue(response)) {
          return { saveQuery: false };
        }

        return {
          ...response,
          datePartValue: formatFallbackValue(response.datePartValue, fallbackOptions),
        };
      }

      return { saveQuery: false };
    };

    const getFirstDatePartValueMatchingWithQuery: TemporalFieldQueryApplier = (queryValue, dp) => {
      switch (dp.token.config.part) {
        case 'month': {
          const formatFallbackValue = (fallbackValue: string) =>
            this.getDatePartValueInForAnotherToken(
              fallbackValue,
              adapter.formats.monthFullLetter,
              dp.token.value,
            );

          return testQueryOnFormatAndFallbackFormat(
            queryValue,
            dp.token,
            adapter.formats.monthFullLetter,
            formatFallbackValue,
          );
        }

        case 'weekDay': {
          const formatFallbackValue = (fallbackValue: string, fallbackOptions: string[]) =>
            fallbackOptions.indexOf(fallbackValue).toString();

          return testQueryOnFormatAndFallbackFormat(
            queryValue,
            dp.token,
            adapter.formats.weekday,
            formatFallbackValue,
          );
        }

        case 'meridiem': {
          return testQueryOnFormatAndFallbackFormat(queryValue, dp.token);
        }

        default: {
          return { saveQuery: false };
        }
      }
    };

    return this.applyQuery(parameters, getFirstDatePartValueMatchingWithQuery);
  }

  private applyNumericEditing(parameters: EditSectionParameters) {
    const adapter = selectors.adapter(this.state);
    const localizedDigits = getLocalizedDigits(adapter);

    const getNewDatePartValue = ({
      queryValue,
      skipIfBelowMinimum,
      datePart: dp,
    }: {
      queryValue: string;
      skipIfBelowMinimum: boolean;
      datePart: TemporalFieldDatePart;
    }): ReturnType<TemporalFieldQueryApplier> => {
      const cleanQueryValue = removeLocalizedDigits(queryValue, localizedDigits);
      const queryValueNumber = Number(cleanQueryValue);
      const boundaries = dp.token.boundaries.characterEditing;

      if (queryValueNumber > boundaries.maximum) {
        return { saveQuery: false };
      }

      // If the user types `0` on a month part,
      // It is below the minimum, but we want to store the `0` in the query,
      // So that when he pressed `1`, it will store `01` and move to the next part.
      if (skipIfBelowMinimum && queryValueNumber < boundaries.minimum) {
        return { saveQuery: true };
      }

      const shouldGoToNextSection =
        queryValueNumber * 10 > boundaries.maximum ||
        cleanQueryValue.length === boundaries.maximum.toString().length;

      const newDatePartValue = cleanDigitDatePartValue(
        adapter,
        queryValueNumber,
        localizedDigits,
        dp.token,
      );

      return { datePartValue: newDatePartValue, shouldGoToNextSection };
    };

    const getFirstDatePartValueMatchingWithQuery: TemporalFieldQueryApplier = (queryValue, dp) => {
      if (
        dp.token.config.contentType === 'digit' ||
        dp.token.config.contentType === 'digit-with-letter'
      ) {
        return getNewDatePartValue({
          queryValue,
          skipIfBelowMinimum: true,
          datePart: dp,
        });
      }

      // When editing a letter-format month and the user presses a digit,
      // We can support the numeric editing by using the digit-format month and re-formatting the result.
      if (dp.token.config.part === 'month') {
        const response = getNewDatePartValue({
          queryValue,
          skipIfBelowMinimum: true,
          datePart: {
            ...dp,
            token: FormatParser.buildSingleToken(
              adapter,
              adapter.formats.monthPadded,
              selectors.validationProps(this.state),
            ),
          },
        });

        if (isQueryResponseWithoutValue(response)) {
          return response;
        }

        const formattedValue = this.getDatePartValueInForAnotherToken(
          response.datePartValue,
          adapter.formats.monthPadded,
          dp.token.value,
        );

        return {
          ...response,
          datePartValue: formattedValue,
        };
      }

      // When editing a letter-format weekDay and the user presses a digit,
      // We can support the numeric editing by returning the nth day in the week day array.
      if (dp.token.config.part === 'weekDay') {
        const response = getNewDatePartValue({
          queryValue,
          skipIfBelowMinimum: true,
          datePart: dp,
        });
        if (isQueryResponseWithoutValue(response)) {
          return response;
        }

        const formattedValue = getWeekDaysStr(adapter, dp.token.value)[
          Number(response.datePartValue) - 1
        ];
        return {
          ...response,
          datePartValue: formattedValue,
        };
      }

      return { saveQuery: false };
    };

    return this.applyQuery(
      { ...parameters, keyPressed: applyLocalizedDigits(parameters.keyPressed, localizedDigits) },
      getFirstDatePartValueMatchingWithQuery,
      (queryValue) => isStringNumber(queryValue, localizedDigits),
    );
  }

  private applyQuery(
    parameters: EditSectionParameters,
    getFirstDatePartValueMatchingWithQuery: TemporalFieldQueryApplier,
    isValidQueryValue?: (queryValue: string) => boolean,
  ) {
    const { keyPressed, sectionIndex } = parameters;
    const cleanKeyPressed = keyPressed.toLowerCase();
    const currentCharacterQuery = selectors.characterQuery(this.state);
    const dp = selectors.datePart(this.state, sectionIndex);

    if (dp == null) {
      return null;
    }

    // The current query targets the date part being editing
    // We can try to concatenate the value
    if (
      currentCharacterQuery != null &&
      (!isValidQueryValue || isValidQueryValue(currentCharacterQuery.value)) &&
      currentCharacterQuery.sectionIndex === sectionIndex
    ) {
      const concatenatedQueryValue = `${currentCharacterQuery.value}${cleanKeyPressed}`;

      const queryResponse = getFirstDatePartValueMatchingWithQuery(concatenatedQueryValue, dp);
      if (!isQueryResponseWithoutValue(queryResponse)) {
        this.setCharacterQuery({
          sectionIndex,
          value: concatenatedQueryValue,
          part: dp.token.config.part,
        });
        return queryResponse;
      }

      // Concatenation failed
      // For numeric editing: Check if the concatenated value was valid format (e.g., '15' is a valid number)
      //   but failed due to boundary validation. If so, reject the input and keep current value.
      // For letter editing: Check if we have an existing value in the datePart.
      //   If so, keep it and reject the new input.
      if (
        (isValidQueryValue && isValidQueryValue(concatenatedQueryValue)) ||
        (!isValidQueryValue && dp.value !== '')
      ) {
        // Reject the input, keep current value, and reset query
        this.resetCharacterQuery();
        return null;
      }

      // If concatenated value was invalid AND there's no existing value to preserve,
      // reset query and try starting a new query with the new key
      this.resetCharacterQuery();
    }

    const queryResponse = getFirstDatePartValueMatchingWithQuery(cleanKeyPressed, dp);
    if (isQueryResponseWithoutValue(queryResponse) && !queryResponse.saveQuery) {
      this.resetCharacterQuery();
      return null;
    }

    this.setCharacterQuery({
      sectionIndex,
      value: cleanKeyPressed,
      part: dp.token.config.part,
    });

    if (isQueryResponseWithoutValue(queryResponse)) {
      return null;
    }

    return queryResponse;
  }

  private setCharacterQuery(characterQuery: TemporalFieldCharacterEditingQuery | null) {
    this.set('characterQuery', characterQuery);
    if (characterQuery != null) {
      this.timeoutManager.startTimeout(
        'cleanCharacterQuery',
        TemporalFieldStore.queryLifeDuration,
        () => this.set('characterQuery', null),
      );
    } else {
      this.timeoutManager.clearTimeout('cleanCharacterQuery');
    }
  }

  private getDatePartValueInForAnotherToken(
    valueStr: string,
    currentFormat: string,
    newFormat: string,
  ) {
    const adapter = selectors.adapter(this.state);
    const timezone = selectors.timezoneToRender(this.state);

    if (process.env.NODE_ENV !== 'production') {
      if (FormatParser.getTokenConfig(adapter, currentFormat).part === 'weekDay') {
        throw new Error("getDatePartValueInForAnotherToken doesn't support week day formats");
      }
    }

    return adapter.formatByString(adapter.parse(valueStr, currentFormat, timezone)!, newFormat);
  }
}
