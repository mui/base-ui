import { TemporalSupportedValue } from '../../../../types';
import { getLocalizedDigits } from '../adapter-cache';
import { cleanDigitDatePartValue, getLetterEditingOptions, removeLocalizedDigits } from '../utils';
import { TemporalFieldStore } from '../TemporalFieldStore';
import { selectors } from '../selectors';
import { TemporalFieldSectionPlugin } from './TemporalFieldSectionPlugin';
import { TemporalFieldDatePart } from '../types';

/**
 * Plugin to adjust the value of the active section when pressing ArrowUp, ArrowDown, PageUp, PageDown, Home or End.
 */
export class TemporalFieldValueAdjustmentPlugin<TValue extends TemporalSupportedValue> {
  private store: TemporalFieldStore<TValue>;

  private static queryLifeDuration = 5000;

  // We can't type `store`, otherwise we get the following TS error:
  // 'valueAdjustment' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;
  }

  public isAdjustSectionValueKeyCode(keyCode: string): keyCode is AdjustDatePartValueKeyCode {
    return TemporalFieldValueAdjustmentPlugin.keyCodes.has(keyCode as AdjustDatePartValueKeyCode);
  }

  /**
   * Adjusts the value of the active section based on the provided key code.
   * For example, pressing ArrowUp will increment the section's value.
   */
  public adjustActiveDatePartValue(keyCode: AdjustDatePartValueKeyCode, sectionIndex: number) {
    if (!selectors.editable(this.store.state)) {
      return;
    }

    this.store.section.updateDatePart({
      sectionIndex,
      newDatePartValue: this.getAdjustedDatePartValue(keyCode, sectionIndex),
      shouldGoToNextSection: false,
    });

    this.store.timeoutManager.startInterval(
      'cleanCharacterQuery',
      TemporalFieldValueAdjustmentPlugin.queryLifeDuration,
      () => this.store.set('characterQuery', null),
    );
  }

  private getAdjustedDatePartValue(keyCode: AdjustDatePartValueKeyCode, sectionIndex: number) {
    const adapter = selectors.adapter(this.store.state);
    const validationProps = selectors.validationProps(this.store.state);
    const datePart = TemporalFieldSectionPlugin.selectors.datePart(this.store.state, sectionIndex);

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
      const timezone = selectors.timezoneToRender(this.store.state);
      return adapter.formatByString(adapter.now(timezone), datePart.token.value);
    }

    const step = datePart.token.isMostGranularPart ? selectors.step(this.store.state) : 1;
    const delta = getAdjustmentDelta(keyCode, datePart.value);
    const direction = getDirection(keyCode);
    const contentType = datePart.token.config.contentType;

    if (contentType === 'digit' || contentType === 'digit-with-letter') {
      return this.getAdjustedDigitPartValue(datePart, delta, direction, step);
    }

    return this.getAdjustedLetterPartValue(datePart, delta, direction, step);
  }

  private getAdjustedDigitPartValue(
    datePart: TemporalFieldDatePart,
    delta: number | 'boundary',
    direction: 'up' | 'down',
    step: number,
  ) {
    const adapter = selectors.adapter(this.store.state);
    const localizedDigits = getLocalizedDigits(adapter);
    const boundaries = datePart.token.boundaries.adjustment;

    const formatValue = (value: number) =>
      cleanDigitDatePartValue(adapter, value, localizedDigits, datePart.token);

    let newValue: number;

    if (delta === 'boundary') {
      newValue = direction === 'up' ? boundaries.minimum : boundaries.maximum;
    } else {
      const currentValue = parseInt(removeLocalizedDigits(datePart.value, localizedDigits), 10);
      newValue = currentValue + delta * step;

      // Align to step boundary if needed
      if (step > 1 && newValue % step !== 0) {
        newValue = alignToStep(newValue, step, direction);
      }
    }

    return formatValue(wrapInRange(newValue, boundaries.minimum, boundaries.maximum));
  }

  private getAdjustedLetterPartValue(
    datePart: TemporalFieldDatePart,
    delta: number | 'boundary',
    direction: 'up' | 'down',
    step: number,
  ) {
    const adapter = selectors.adapter(this.store.state);

    const options = getLetterEditingOptions(
      adapter,
      datePart.token.config.part,
      datePart.token.value,
    );

    if (options.length === 0) {
      return datePart.value;
    }

    if (delta === 'boundary') {
      return direction === 'up' ? options[0] : options[options.length - 1];
    }

    const currentIndex = options.indexOf(datePart.value);
    const newIndex = (currentIndex + delta * step) % options.length;
    // Handle negative modulo (JS returns negative for negative dividend)
    const wrappedIndex = (newIndex + options.length) % options.length;

    return options[wrappedIndex];
  }

  private static keyCodes: Set<AdjustDatePartValueKeyCode> = new Set([
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
    'PageUp',
    'PageDown',
  ]);
}

type AdjustDatePartValueKeyCode = 'ArrowUp' | 'ArrowDown' | 'PageUp' | 'PageDown' | 'Home' | 'End';

function getAdjustmentDelta(
  keyCode: AdjustDatePartValueKeyCode,
  currentValue: string,
): number | 'boundary' {
  const isStart = keyCode === 'Home';
  const isEnd = keyCode === 'End';

  if (currentValue === '' || isStart || isEnd) {
    return 'boundary';
  }

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
      return 'boundary';
  }
}

function getDirection(keyCode: AdjustDatePartValueKeyCode): 'up' | 'down' {
  return keyCode === 'ArrowUp' || keyCode === 'PageUp' || keyCode === 'Home' ? 'up' : 'down';
}

function isIncrementDirection(keyCode: AdjustDatePartValueKeyCode): boolean {
  return keyCode === 'ArrowUp' || keyCode === 'PageUp';
}

function isDecrementDirection(keyCode: AdjustDatePartValueKeyCode): boolean {
  return keyCode === 'ArrowDown' || keyCode === 'PageDown';
}

/**
 * Wraps a value within [min, max] bounds, cycling around when exceeding limits.
 * E.g., wrapInRange(32, 1, 31) => 1, wrapInRange(0, 1, 31) => 31
 */
function wrapInRange(value: number, min: number, max: number): number {
  const range = max - min + 1;
  if (value > max) {
    return min + ((value - max - 1) % range);
  }
  if (value < min) {
    return max - ((min - value - 1) % range);
  }
  return value;
}

/**
 * Aligns a value to the nearest step boundary in the given direction.
 * - 'up' rounds down (e.g., alignToStep(22, 5, 'up') => 20)
 * - 'down' rounds up (e.g., alignToStep(22, 5, 'down') => 25)
 */
function alignToStep(value: number, step: number, direction: 'up' | 'down'): number {
  if (value % step === 0) {
    return value;
  }
  if (direction === 'down') {
    // For JS: -3 % 5 = -3 (should be 2), so we use (step + value) % step
    return value + step - ((step + value) % step);
  }
  return value - (value % step);
}
