import { createSelectorMemoized } from '@base-ui/utils/store/createSelector';
import { TemporalAdapter, TemporalSupportedValue, TemporalTimezone } from '../../../../types';
import { selectors } from '../selectors';
import { TemporalFieldSectionPlugin } from './TemporalFieldSectionPlugin';
import { TemporalFieldStore } from '../TemporalFieldStore';
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

const sectionPropsSelectors = {
  sectionProps: createSelectorMemoized(
    (state: State) => state.adapter,
    selectors.editable,
    selectors.disabled,
    selectors.readOnly,
    selectors.timezoneToRender,
    TemporalFieldSectionPlugin.selectors.datePartBoundaries,
    (
      adapter,
      editable,
      disabled,
      readOnly,
      timezone,
      datePartBoundaries,
      section: TemporalFieldSection,
    ): React.HTMLAttributes<HTMLDivElement> => {
      // Date part
      if (isDatePart(section)) {
        return {
          // Aria attributes
          'aria-readonly': readOnly,
          'aria-valuenow': getAriaValueNow(adapter, section),
          'aria-valuemin': datePartBoundaries.minimum,
          'aria-valuemax': datePartBoundaries.maximum,
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
          // 'data-range-position': (section as FieldRangeSection).dateName || undefined,
          spellCheck: editable ? false : undefined,
          // Firefox hydrates this as `'none`' instead of `'off'`. No problems in chromium with both values.
          // For reference https://github.com/mui/mui-x/issues/19012
          autoCapitalize: editable ? 'none' : undefined,
          autoCorrect: editable ? 'off' : undefined,
          inputMode: section.token.config.contentType === 'letter' ? 'text' : 'numeric',
        };
      }

      // Separator
      return {
        // Aria attributes
        'aria-hidden': true,

        // Other
        children: section.value,
      };
    },
  ),
};

/**
 * Plugin to build the props to pass to the section part.
 */
export class TemporalFieldSectionPropsPlugin<TValue extends TemporalSupportedValue> {
  private store: TemporalFieldStore<TValue, any>;

  public static selectors = sectionPropsSelectors;

  // We can't type `store`, otherwise we get the following TS error:
  // 'sectionProps' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;
  }

  public handleClick = (event: React.MouseEvent<HTMLElement>) => {
    // The click event on the clear button would propagate to the input, trigger this handler and result in a wrong section selection.
    // We avoid this by checking if the call to this function is actually intended, or a side effect.
    if (selectors.disabled(this.store.state) || event.isDefaultPrevented()) {
      return;
    }

    const sectionIndex = this.store.dom.getSectionIndexFromDOMElement(event.target as HTMLElement)!;
    this.store.section.selectClosestDatePart(sectionIndex);
  };

  public handleInput = (event: React.FormEvent) => {
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

  public handlePaste = (event: React.ClipboardEvent) => {
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

  public handleMouseUp = (event: React.MouseEvent) => {
    // Without this, the browser will remove the selected when clicking inside an already-selected section.
    event.preventDefault();
  };

  public handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'none';
  };

  public handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
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

        if (!selectors.editable(this.store.state)) {
          break;
        }

        this.store.section.updateDatePart({
          sectionIndex,
          newDatePartValue: this.store.valueAdjustment.adjustActiveDatePartValue(event.key),
          shouldGoToNextSection: false,
        });
        break;
      }
    }
  };

  public handleFocus = (event: React.FocusEvent) => {
    if (selectors.disabled(this.store.state)) {
      return;
    }

    const sectionIndex = this.store.dom.getSectionIndexFromDOMElement(event.target)!;
    this.store.section.selectClosestDatePart(sectionIndex);
  };

  public handleBlur = () => {
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
