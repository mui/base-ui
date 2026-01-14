import { TemporalSupportedValue } from '../../../types';
import { cleanDigitSectionValue, getLetterEditingOptions, removeLocalizedDigits } from './utils';
import { TemporalFieldStore } from './TemporalFieldStore';
import { selectors } from './selectors';
import { TemporalFieldSectionPlugin } from './TemporalFieldSectionPlugin';

// TODO: Implement props to configure steps for different section types
const stepsAttributes = {
  minutesStep: 5,
};

/**
 * Plugin to adjust the value of the active section when pressing ArrowUp, ArrowDown, PageUp, PageDown, Home or End.
 */
export class TemporalFieldValueAdjustmentPlugin<TValue extends TemporalSupportedValue> {
  private store: TemporalFieldStore<TValue, any, any>;

  // We can't type `store`, otherwise we get the following TS error:
  // 'valueAdjustment' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;
  }

  public isAdjustSectionValueKeyCode(keyCode: string): keyCode is AdjustSectionValueKeyCode {
    return TemporalFieldValueAdjustmentPlugin.keyCodes.has(keyCode as AdjustSectionValueKeyCode);
  }

  /**
   * Adjusts the value of the active section based on the provided key code.
   * For example, pressing ArrowUp will increment the section's value.
   */
  public adjustActiveSectionValue(keyCode: AdjustSectionValueKeyCode) {
    const adapter = selectors.adapter(this.store.state);
    const localizedDigits = selectors.localizedDigits(this.store.state);
    const timezone = selectors.timezoneToRender(this.store.state);
    const activeSection = TemporalFieldSectionPlugin.selectors.activeSection(this.store.state);

    if (activeSection == null) {
      return '';
    }

    const delta = getDeltaFromKeyCode(keyCode);
    const isStart = keyCode === 'Home';
    const isEnd = keyCode === 'End';
    const shouldSetAbsolute = activeSection.value === '' || isStart || isEnd;

    // Digit section
    if (
      activeSection.token.config.contentType === 'digit' ||
      activeSection.token.config.contentType === 'digit-with-letter'
    ) {
      const sectionBoundaries = TemporalFieldSectionPlugin.selectors.sectionBoundaries(
        this.store.state,
        activeSection,
      );

      const getCleanValue = (newSectionValue: number) =>
        cleanDigitSectionValue(
          adapter,
          newSectionValue,
          sectionBoundaries,
          localizedDigits,
          activeSection.token,
        );

      const step =
        activeSection.token.config.sectionType === 'minutes' && stepsAttributes?.minutesStep
          ? stepsAttributes.minutesStep
          : 1;

      let newSectionValueNumber: number;

      if (shouldSetAbsolute) {
        if (activeSection.token.config.sectionType === 'year' && !isEnd && !isStart) {
          return adapter.formatByString(adapter.now(timezone), activeSection.token.value);
        }

        if (delta > 0 || isStart) {
          newSectionValueNumber = sectionBoundaries.minimum;
        } else {
          newSectionValueNumber = sectionBoundaries.maximum;
        }
      } else {
        const currentSectionValue = parseInt(
          removeLocalizedDigits(activeSection.value, localizedDigits),
          10,
        );
        newSectionValueNumber = currentSectionValue + delta * step;
      }

      if (newSectionValueNumber % step !== 0) {
        if (delta < 0 || isStart) {
          newSectionValueNumber += step - ((step + newSectionValueNumber) % step); // for JS -3 % 5 = -3 (should be 2)
        }
        if (delta > 0 || isEnd) {
          newSectionValueNumber -= newSectionValueNumber % step;
        }
      }

      if (newSectionValueNumber > sectionBoundaries.maximum) {
        return getCleanValue(
          sectionBoundaries.minimum +
            ((newSectionValueNumber - sectionBoundaries.maximum - 1) %
              (sectionBoundaries.maximum - sectionBoundaries.minimum + 1)),
        );
      }

      if (newSectionValueNumber < sectionBoundaries.minimum) {
        return getCleanValue(
          sectionBoundaries.maximum -
            ((sectionBoundaries.minimum - newSectionValueNumber - 1) %
              (sectionBoundaries.maximum - sectionBoundaries.minimum + 1)),
        );
      }

      return getCleanValue(newSectionValueNumber);
    }

    /// Letter section
    const options = getLetterEditingOptions(
      adapter,
      timezone,
      activeSection.token.config.sectionType,
      activeSection.token.value,
    );
    if (options.length === 0) {
      return activeSection.value;
    }

    if (shouldSetAbsolute) {
      if (delta > 0 || isStart) {
        return options[0];
      }

      return options[options.length - 1];
    }

    const currentOptionIndex = options.indexOf(activeSection.value);
    const newOptionIndex = (currentOptionIndex + delta) % options.length;
    const clampedIndex = (newOptionIndex + options.length) % options.length;

    return options[clampedIndex];
  }

  private static keyCodes: Set<AdjustSectionValueKeyCode> = new Set([
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
    'PageUp',
    'PageDown',
  ]);
}

function getDeltaFromKeyCode(keyCode: Omit<AdjustSectionValueKeyCode, 'Home' | 'End'>) {
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

type AdjustSectionValueKeyCode = 'ArrowUp' | 'ArrowDown' | 'PageUp' | 'PageDown' | 'Home' | 'End';
