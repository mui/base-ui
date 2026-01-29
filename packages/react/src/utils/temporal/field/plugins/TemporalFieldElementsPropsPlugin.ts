import { createSelectorMemoized } from '@base-ui/utils/store';
import { visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { TemporalAdapter, TemporalSupportedValue, TemporalTimezone } from '../../../../types';
import { TemporalFieldStore } from '../TemporalFieldStore';
import { TemporalFieldValuePlugin } from './TemporalFieldValuePlugin';
import { TemporalFieldSectionPlugin } from './TemporalFieldSectionPlugin';
import { TemporalFieldFormatPlugin } from './TemporalFieldFormatPlugin';
import { selectors } from '../selectors';
import { TemporalFieldState as State, TemporalFieldDatePart, TemporalFieldSection } from '../types';
import { getMeridiemsStr, getMonthsStr, getWeekDaysStr } from '../adapter-cache';
import { isDatePart } from '../utils';

const translations = {
  empty: 'Empty',
  year: 'Year',
  month: 'Month',
  day: 'Day',
  weekDay: 'Week day',
  hours: 'Hours',
  minutes: 'Minutes',
  seconds: 'Seconds',
  meridiem: 'Meridiem',
};

const elementsPropsSelectors = {
  rootState: createSelectorMemoized(
    selectors.required,
    selectors.readOnly,
    selectors.disabled,
    selectors.invalid,
    selectors.fieldContext,
    (required, readOnly, disabled, invalid, fieldContext: any) => ({
      ...(fieldContext?.state || {}),
      required,
      readOnly,
      disabled,
      invalid,
    }),
  ),
  rootProps: createSelectorMemoized(
    TemporalFieldSectionPlugin.selectors.sections,
    (state: State) => state.children,
    (sections, children, store: TemporalFieldStore<any>) => {
      const resolvedChildren =
        typeof children === 'function' ? sections.map((section) => children(section)) : children;

      return {
        onClick: store.elementsProps.handleRootClick,
        children: resolvedChildren,
      };
    },
  ),
  hiddenInputProps: createSelectorMemoized(
    TemporalFieldValuePlugin.selectors.value,
    TemporalFieldFormatPlugin.selectors.parsedFormat,
    selectors.adapter,
    selectors.config,
    selectors.required,
    selectors.disabled,
    selectors.readOnly,
    selectors.name,
    selectors.id,
    selectors.validationProps,
    selectors.step,
    (
      value,
      parsedFormat,
      adapter,
      config,
      required,
      disabled,
      readOnly,
      name,
      id,
      validationProps,
      step,
      store: TemporalFieldStore<any>,
    ) => ({
      ...config.stringifyValidationPropsForHiddenInput(
        adapter,
        validationProps,
        parsedFormat,
        step,
      ),
      type: config.hiddenInputType,
      value: config.stringifyValueForHiddenInput(adapter, value, parsedFormat.granularity),
      name,
      id,
      disabled,
      readOnly,
      required,
      'aria-hidden': true,
      tabIndex: -1,
      style: visuallyHiddenInput,
      onChange: store.elementsProps.handleHiddenInputChange,
      onFocus: store.elementsProps.handleHiddenInputFocus,
    }),
  ),
  /**
   * Returns the params to pass to `useField` hook for form integration.
   */
  useFieldParams: createSelectorMemoized(
    selectors.id,
    selectors.name,
    selectors.adapter,
    selectors.config,
    selectors.fieldContext,
    selectors.inputRef,
    TemporalFieldValuePlugin.selectors.value,
    TemporalFieldFormatPlugin.selectors.parsedFormat,
    (id, name, adapter, config, fieldContext, inputRef, value, parsedFormat) => {
      const formValue = config.stringifyValueForHiddenInput(
        adapter,
        value,
        parsedFormat.granularity,
      );
      return {
        id,
        name,
        value: formValue,
        getValue: () => formValue,
        commit: fieldContext?.validation.commit ?? (async () => {}),
        controlRef: inputRef,
      };
    },
  ),
  sectionProps: createSelectorMemoized(
    (state: State) => state.adapter,
    selectors.editable,
    selectors.disabled,
    selectors.readOnly,
    selectors.timezoneToRender,
    (
      adapter,
      editable,
      disabled,
      readOnly,
      timezone,
      section: TemporalFieldSection,
      store: TemporalFieldStore<any>,
    ): React.HTMLAttributes<HTMLDivElement> => {
      const eventHandlers = {
        onClick: store.elementsProps.handleSectionClick,
        onInput: store.elementsProps.handleSectionInput,
        onPaste: store.elementsProps.handleSectionPaste,
        onKeyDown: store.elementsProps.handleSectionKeyDown,
        onMouseUp: store.elementsProps.handleSectionMouseUp,
        onDragOver: store.elementsProps.handleSectionDragOver,
        onFocus: store.elementsProps.handleSectionFocus,
        onBlur: store.elementsProps.handleSectionBlur,
      };

      // Date part
      if (isDatePart(section)) {
        return {
          // Aria attributes
          'aria-readonly': readOnly,
          'aria-valuenow': getAriaValueNow(adapter, section),
          'aria-valuemin': section.token.boundaries.characterEditing.minimum,
          'aria-valuemax': section.token.boundaries.characterEditing.maximum,
          'aria-valuetext': section.value
            ? getAriaValueText(adapter, section, timezone)
            : translations.empty,
          'aria-label': translations[section.token.config.part],
          'aria-disabled': disabled,

          // Other
          children: section.value || section.token.placeholder,
          tabIndex: editable ? 0 : -1,
          contentEditable: editable,
          suppressContentEditableWarning: true,
          role: 'spinbutton',
          spellCheck: editable ? false : undefined,
          // Firefox hydrates this as `'none`' instead of `'off'`. No problems in chromium with both values.
          // For reference https://github.com/mui/mui-x/issues/19012
          autoCapitalize: editable ? 'none' : undefined,
          autoCorrect: editable ? 'off' : undefined,
          inputMode: section.token.config.contentType === 'letter' ? 'text' : 'numeric',

          // Event handlers
          ...eventHandlers,
        };
      }

      // Separator
      return {
        // Aria attributes
        'aria-hidden': true,

        // Other
        children: section.value,
        style: { whiteSpace: 'pre' },

        // Event handlers
        ...eventHandlers,
      };
    },
  ),
  clearProps: createSelectorMemoized(
    selectors.disabled,
    selectors.readOnly,
    (
      disabled,
      readOnly,
      store: TemporalFieldStore<any>,
    ): React.HTMLAttributes<HTMLButtonElement> => ({
      tabIndex: -1,
      children: '✕',
      'aria-readonly': readOnly || undefined,
      'aria-disabled': disabled || undefined,
      onMouseDown: store.elementsProps.handleClearMouseDown,
      onClick: store.elementsProps.handleClearClick,
    }),
  ),
};

/**
 * Plugin to build the props to pass to the root and section parts.
 */
export class TemporalFieldElementsPropsPlugin<TValue extends TemporalSupportedValue> {
  private store: TemporalFieldStore<TValue>;

  public static selectors = elementsPropsSelectors;

  // We can't type `store`, otherwise we get the following TS error:
  // 'elementsProps' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;
  }

  // ======================
  // Root element handlers
  // ======================

  public handleHiddenInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Workaround for https://github.com/facebook/react/issues/9023
    if (event.nativeEvent.defaultPrevented) {
      return;
    }

    this.store.value.updateFromString(event.target.value);
  };

  public handleHiddenInputFocus = () => {
    this.store.section.selectClosestDatePart(0);
  };

  public handleRootClick = () => {
    if (selectors.disabled(this.store.state) || !this.store.dom.inputRef.current) {
      return;
    }

    if (
      !this.store.dom.isFocused() &&
      TemporalFieldSectionPlugin.selectors.selectedSection(this.store.state) == null
    ) {
      this.store.section.selectClosestDatePart(0);
    }
  };

  // ======================
  // Clear element handlers
  // ======================

  public handleClearMouseDown = (event: React.MouseEvent) => {
    // Prevent focus stealing from the input
    event.preventDefault();
  };

  public handleClearClick = () => {
    if (selectors.disabled(this.store.state) || selectors.readOnly(this.store.state)) {
      return;
    }

    this.store.value.clear();
    this.store.dom.inputRef.current?.focus();
  };

  // =========================
  // Section element handlers
  // =========================

  public handleSectionClick = (event: React.MouseEvent<HTMLElement>) => {
    // The click event on the clear button would propagate to the input, trigger this handler and result in a wrong section selection.
    // We avoid this by checking if the call to this function is actually intended, or a side effect.
    if (selectors.disabled(this.store.state) || event.isDefaultPrevented()) {
      return;
    }

    const sectionIndex = this.store.dom.getSectionIndexFromDOMElement(event.target as HTMLElement)!;
    this.store.section.selectClosestDatePart(sectionIndex);
  };

  public handleSectionInput = (event: React.FormEvent) => {
    const target = event.target as HTMLSpanElement;
    const keyPressed = target.textContent ?? '';
    const sectionIndex = this.store.dom.getSectionIndexFromDOMElement(target);
    if (sectionIndex == null) {
      return;
    }

    if (!selectors.editable(this.store.state)) {
      this.store.dom.syncDatePartContentToDOM(sectionIndex);
      return;
    }

    const section = TemporalFieldSectionPlugin.selectors.datePart(this.store.state, sectionIndex);
    if (section == null) {
      return;
    }

    if (keyPressed.length === 0) {
      if (section.value === '') {
        this.store.dom.syncDatePartContentToDOM(sectionIndex);
        return;
      }

      const inputType = (event.nativeEvent as InputEvent).inputType;
      if (inputType === 'insertParagraph' || inputType === 'insertLineBreak') {
        this.store.dom.syncDatePartContentToDOM(sectionIndex);
        return;
      }

      this.store.dom.syncDatePartContentToDOM(sectionIndex);
      this.store.section.clearActive();
      return;
    }

    this.store.characterEditing.editSection({
      keyPressed,
      sectionIndex,
    });

    // The DOM value needs to remain the one React is expecting.
    this.store.dom.syncDatePartContentToDOM(sectionIndex);
  };

  public handleSectionPaste = (event: React.ClipboardEvent) => {
    // prevent default to avoid the input `onInput` handler being called
    event.preventDefault();

    const sectionIndex = this.store.dom.getSectionIndexFromDOMElement(event.target as HTMLElement);
    if (!selectors.editable(this.store.state) || sectionIndex == null) {
      return;
    }

    const section = TemporalFieldSectionPlugin.selectors.datePart(this.store.state, sectionIndex);
    if (section == null) {
      return;
    }

    const pastedValue = event.clipboardData.getData('text');
    const lettersOnly = /^[a-zA-Z]+$/.test(pastedValue);
    const digitsOnly = /^[0-9]+$/.test(pastedValue);
    const digitsAndLetterOnly = /^(([a-zA-Z]+)|)([0-9]+)(([a-zA-Z]+)|)$/.test(pastedValue);
    const isValidPastedValue =
      (section.token.config.contentType === 'letter' && lettersOnly) ||
      (section.token.config.contentType === 'digit' && digitsOnly) ||
      (section.token.config.contentType === 'digit-with-letter' && digitsAndLetterOnly);

    if (isValidPastedValue) {
      this.store.characterEditing.resetCharacterQuery();
      this.store.section.updateDatePart({
        sectionIndex,
        newDatePartValue: pastedValue,
        shouldGoToNextSection: true,
      });
    }
    // If the pasted value corresponds to a single section, but not the expected type, we skip the modification
    else if (!lettersOnly && !digitsOnly) {
      this.store.characterEditing.resetCharacterQuery();
      this.store.value.updateFromString(pastedValue);
    }
  };

  public handleSectionMouseUp = (event: React.MouseEvent) => {
    // Without this, the browser will remove the selected when clicking inside an already-selected section.
    event.preventDefault();
  };

  public handleSectionDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'none';
  };

  public handleSectionKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (selectors.disabled(this.store.state)) {
      return;
    }

    const sectionIndex = this.store.dom.getSectionIndexFromDOMElement(event.target as HTMLElement);
    if (sectionIndex == null) {
      return;
    }

    // eslint-disable-next-line default-case
    switch (true) {
      // Move selection to next section
      case event.key === 'ArrowRight': {
        event.preventDefault();
        this.store.section.selectNextDatePart();
        break;
      }

      // Move selection to previous section
      case event.key === 'ArrowLeft': {
        event.preventDefault();
        this.store.section.selectPreviousDatePart();
        break;
      }

      // Reset the value of the current section
      case event.key === 'Delete': {
        event.preventDefault();

        if (!selectors.editable(this.store.state)) {
          break;
        }

        this.store.section.updateDatePart({
          sectionIndex,
          newDatePartValue: '',
          shouldGoToNextSection: false,
        });
        break;
      }

      // Increment / decrement the current section value
      case this.store.valueAdjustment.isAdjustSectionValueKeyCode(event.key): {
        event.preventDefault();
        this.store.valueAdjustment.adjustActiveDatePartValue(event.key, sectionIndex);
        break;
      }
    }
  };

  public handleSectionFocus = (event: React.FocusEvent) => {
    if (selectors.disabled(this.store.state)) {
      return;
    }

    const sectionIndex = this.store.dom.getSectionIndexFromDOMElement(event.target)!;
    this.store.section.selectClosestDatePart(sectionIndex);
  };

  public handleSectionBlur = () => {
    // Defer to next tick to check if focus moved to another section
    this.store.timeoutManager.startTimeout('blur-detection', 0, () => {
      const activeEl = this.store.dom.getActiveElement();
      const newSectionIndex = this.store.dom.getSectionIndexFromDOMElement(activeEl);

      // If focus didn't move to another section in this field, clear selection
      if (newSectionIndex == null || !this.store.dom.inputRef.current?.contains(activeEl)) {
        this.store.section.removeSelectedSection();
      }
    });
  };
}

function getAriaValueNow(
  adapter: TemporalAdapter,
  section: TemporalFieldDatePart,
): number | undefined {
  if (section.value === '') {
    return undefined;
  }

  switch (section.token.config.part) {
    case 'month': {
      if (section.token.config.contentType === 'letter') {
        const index = getMonthsStr(adapter, section.token.value).indexOf(section.value);
        return index >= 0 ? index + 1 : undefined;
      }
      return Number(section.value);
    }
    case 'weekDay': {
      if (section.token.config.contentType === 'letter') {
        const index = getWeekDaysStr(adapter, section.token.value).indexOf(section.value);
        return index >= 0 ? index + 1 : undefined;
      }
      return Number(section.value);
    }
    case 'day':
      return parseInt(section.value, 10);
    case 'meridiem': {
      const index = getMeridiemsStr(adapter, section.token.value).indexOf(section.value);
      return index >= 0 ? index : undefined;
    }
    default:
      return section.token.config.contentType !== 'letter' ? Number(section.value) : undefined;
  }
}

function getAriaValueText(
  adapter: TemporalAdapter,
  section: TemporalFieldDatePart,
  timezone: TemporalTimezone,
): string | undefined {
  if (section.value === '') {
    return undefined;
  }

  switch (section.token.config.part) {
    case 'month': {
      if (section.token.config.contentType === 'digit') {
        const dateWithMonth = adapter.setMonth(adapter.now(timezone), Number(section.value) - 1);
        return adapter.isValid(dateWithMonth)
          ? adapter.format(dateWithMonth, 'monthFullLetter')
          : '';
      }
      const parsedDate = adapter.parse(section.value, section.token.value, timezone);
      return parsedDate && adapter.isValid(parsedDate)
        ? adapter.format(parsedDate, 'monthFullLetter')
        : undefined;
    }
    case 'day':
      if (section.token.config.contentType === 'digit') {
        const dateWithDay = adapter.setDate(
          adapter.startOfYear(adapter.now(timezone)),
          Number(section.value),
        );
        return adapter.isValid(dateWithDay)
          ? adapter.format(dateWithDay, 'dayOfMonthWithLetter')
          : '';
      }
      return section.value;
    case 'weekDay': {
      const startOfWeekDate = adapter.startOfWeek(adapter.now(timezone));
      if (section.token.config.contentType === 'digit') {
        const dateWithWeekDay = adapter.addDays(startOfWeekDate, Number(section.value) - 1);
        return adapter.isValid(dateWithWeekDay) ? adapter.format(dateWithWeekDay, 'weekday') : '';
      }
      const formattedDaysInWeek = getWeekDaysStr(adapter, section.token.value);
      const index = formattedDaysInWeek.indexOf(section.value);
      if (index < 0) {
        return undefined;
      }
      const dateWithWeekDay = adapter.addDays(startOfWeekDate, index);
      return adapter.isValid(dateWithWeekDay)
        ? adapter.format(dateWithWeekDay, 'weekday')
        : undefined;
    }
    default:
      return undefined;
  }
}
