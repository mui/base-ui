import { createSelector, createSelectorMemoized } from '@base-ui/utils/store';
import { warn } from '@base-ui/utils/warn';
import { TemporalFieldDatePartType, TemporalSupportedValue } from '../../../../types';
import { TemporalFieldStore } from '../TemporalFieldStore';
import {
  TemporalFieldState as State,
  TemporalFieldParsedFormat,
  TemporalFieldToken,
} from '../types';
import { FormatParser } from '../formatParser';
import { TemporalDateType } from '../../types';
import { isToken } from '../utils';
import { selectors } from '../selectors';

const formatSelectors = {
  format: createSelector((state: State) => state.format),
  parsedFormat: createSelectorMemoized(
    selectors.adapter,
    selectors.manager,
    (state: State) => state.format,
    (state: State) => state.direction,
    (state: State) => state.placeholderGetters,
    (state: State) => state.validationProps,
    (adapter, manager, format, direction, placeholderGetters, validationProps) => {
      const parsedFormat = FormatParser.parse(
        adapter,
        format,
        direction,
        placeholderGetters,
        validationProps,
      );
      validateFormat(parsedFormat, manager.dateType);

      return parsedFormat;
    },
  ),
};

/**
 * Plugin to interact with a single section of the field value.
 */
export class TemporalFieldFormatPlugin<TValue extends TemporalSupportedValue> {
  private store: TemporalFieldStore<TValue, any>;

  public static selectors = formatSelectors;

  // We can't type `store`, otherwise we get the following TS error:
  // 'format' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;
  }
}

function validateFormat(parsedFormat: TemporalFieldParsedFormat, dateType: TemporalDateType) {
  if (process.env.NODE_ENV !== 'production') {
    const supportedSections: TemporalFieldDatePartType[] = [];
    if (['date', 'date-time'].includes(dateType)) {
      supportedSections.push('weekDay', 'day', 'month', 'year');
    }
    if (['time', 'date-time'].includes(dateType)) {
      supportedSections.push('hours', 'minutes', 'seconds', 'meridiem');
    }

    const invalidDatePart = parsedFormat.elements.find(
      (element) => isToken(element) && !supportedSections.includes(element.config.part),
    ) as TemporalFieldToken | undefined;

    if (invalidDatePart) {
      warn(
        `Base UI: The field component you are using is not compatible with the "${invalidDatePart.config.part}" date section.`,
        `The supported date parts are ["${supportedSections.join('", "')}"]\`.`,
      );
    }
  }
}
