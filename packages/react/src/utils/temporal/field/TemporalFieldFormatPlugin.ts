import { createSelectorMemoized } from '@base-ui/utils/store';
import { TemporalFieldSectionType, TemporalSupportedValue } from '../../../types';
import { TemporalFieldStore } from './TemporalFieldStore';
import { TemporalFieldState as State, TemporalFieldParsedFormat } from './types';
import { FormatParser } from './parseFormat';
import { TemporalDateType } from '../types';

const formatSelectors = {
  parsedFormat: createSelectorMemoized(
    (state: State) => state.adapter,
    (state: State) => state.manager,
    (state: State) => state.format,
    (state: State) => state.direction,
    (state: State) => state.placeholderGetters,
    (adapter, manager, format, direction, placeholderGetters) => {
      const parsedFormat = FormatParser.build(adapter, format, direction, placeholderGetters);
      validateFormat(parsedFormat, manager.dateType);

      return parsedFormat;
    },
  ),
};

/**
 * Plugin to interact with a single section of the field value.
 */
export class TemporalFieldFormatPlugin<TValue extends TemporalSupportedValue> {
  private store: TemporalFieldStore<TValue, any, any>;

  public selectors = formatSelectors;

  // We can't type `store`, otherwise we get the following TS error:
  // 'format' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;
  }
}

let warnedOnceInvalidSection = false;
function validateFormat(parsedFormat: TemporalFieldParsedFormat, dateType: TemporalDateType) {
  if (process.env.NODE_ENV !== 'production') {
    if (!warnedOnceInvalidSection) {
      const supportedSections: TemporalFieldSectionType[] = ['empty'];
      if (['date', 'date-time'].includes(dateType)) {
        supportedSections.push('weekDay', 'day', 'month', 'year');
      }
      if (['time', 'date-time'].includes(dateType)) {
        supportedSections.push('hours', 'minutes', 'seconds', 'meridiem');
      }

      const invalidSection = parsedFormat.tokens.find(
        (token) => !supportedSections.includes(token.config.sectionType),
      );

      if (invalidSection) {
        console.warn(
          `MUI X: The field component you are using is not compatible with the "${invalidSection.config.sectionType}" date section.`,
          `The supported date sections are ["${supportedSections.join('", "')}"]\`.`,
        );
        warnedOnceInvalidSection = true;
      }
    }
  }
}
