import { TemporalSupportedValue } from '../../../../types';
import { getLocalizedDigits } from '../adapter-cache';
import { cleanDigitDatePartValue, getLetterEditingOptions, removeLocalizedDigits } from '../utils';
import { TemporalFieldStore } from '../TemporalFieldStore';
import { selectors } from '../selectors';
import { TemporalFieldSectionPlugin } from './TemporalFieldSectionPlugin';

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
    const localizedDigits = getLocalizedDigits(adapter);
    const timezone = selectors.timezoneToRender(this.store.state);
    const datePart = TemporalFieldSectionPlugin.selectors.datePart(this.store.state, sectionIndex);

    if (datePart == null) {
      return '';
    }

    const step = datePart.token.isMostGranularPart ? selectors.step(this.store.state) : 1;
    const delta = getDeltaFromKeyCode(keyCode);
    const isStart = keyCode === 'Home';
    const isEnd = keyCode === 'End';
    const shouldSetAbsolute = datePart.value === '' || isStart || isEnd;

    // Digit part
    if (
      datePart.token.config.contentType === 'digit' ||
      datePart.token.config.contentType === 'digit-with-letter'
    ) {
      const boundaries = datePart.token.boundaries.adjustment;

      const getCleanValue = (newDatePartValue: number) =>
        cleanDigitDatePartValue(adapter, newDatePartValue, localizedDigits, datePart.token);

      let newDatePartValueNumber: number;

      if (shouldSetAbsolute) {
        if (datePart.token.config.part === 'year' && !isEnd && !isStart) {
          return adapter.formatByString(adapter.now(timezone), datePart.token.value);
        }

        if (delta > 0 || isStart) {
          newDatePartValueNumber = boundaries.minimum;
        } else {
          newDatePartValueNumber = boundaries.maximum;
        }
      } else {
        const currentSectionValue = parseInt(
          removeLocalizedDigits(datePart.value, localizedDigits),
          10,
        );
        newDatePartValueNumber = currentSectionValue + delta * step;
      }

      if (newDatePartValueNumber % step !== 0) {
        if (delta < 0 || isStart) {
          newDatePartValueNumber += step - ((step + newDatePartValueNumber) % step); // for JS -3 % 5 = -3 (should be 2)
        }
        if (delta > 0 || isEnd) {
          newDatePartValueNumber -= newDatePartValueNumber % step;
        }
      }

      if (newDatePartValueNumber > boundaries.maximum) {
        return getCleanValue(
          boundaries.minimum +
            ((newDatePartValueNumber - boundaries.maximum - 1) %
              (boundaries.maximum - boundaries.minimum + 1)),
        );
      }

      if (newDatePartValueNumber < boundaries.minimum) {
        return getCleanValue(
          boundaries.maximum -
            ((boundaries.minimum - newDatePartValueNumber - 1) %
              (boundaries.maximum - boundaries.minimum + 1)),
        );
      }

      return getCleanValue(newDatePartValueNumber);
    }

    /// Letter part
    const options = getLetterEditingOptions(
      adapter,
      datePart.token.config.part,
      datePart.token.value,
    );
    if (options.length === 0) {
      return datePart.value;
    }

    if (shouldSetAbsolute) {
      if (delta > 0 || isStart) {
        return options[0];
      }

      return options[options.length - 1];
    }

    const currentOptionIndex = options.indexOf(datePart.value);
    const newOptionIndex = (currentOptionIndex + delta * step) % options.length;
    const clampedIndex = (newOptionIndex + options.length) % options.length;

    return options[clampedIndex];
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

function getDeltaFromKeyCode(keyCode: Omit<AdjustDatePartValueKeyCode, 'Home' | 'End'>) {
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
      return 0;
  }
}

type AdjustDatePartValueKeyCode = 'ArrowUp' | 'ArrowDown' | 'PageUp' | 'PageDown' | 'Home' | 'End';
