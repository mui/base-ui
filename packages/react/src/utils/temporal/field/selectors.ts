import { createSelector, createSelectorMemoized } from '@base-ui/utils/store';
import { TemporalFieldState as State } from './types';
import { getTimezoneToRender } from './utils';

// This format should be the same on all the adapters
// If some adapter does not respect this convention, then we will need to hardcode the format on each adapter.
const FORMAT_SECONDS_NO_LEADING_ZEROS = 's';

const NON_LOCALIZED_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const selectors = {
  timezoneToRender: createSelectorMemoized(
    (state: State) => state.adapter,
    (state: State) => state.manager,
    (state: State) => state.value,
    (state: State) => state.referenceDateProp,
    (state: State) => state.timezoneProp,
    getTimezoneToRender,
  ),
  /**
   * Generates the localized digits used by the adapter.
   * This is an array of 10 strings representing the digits 0 to 9 in the localized format.
   */
  localizedDigits: createSelectorMemoized(
    (state: State) => state.adapter,
    (adapter) => {
      const today = adapter.now('default');
      const formattedZero = adapter.formatByString(
        adapter.setSeconds(today, 0),
        FORMAT_SECONDS_NO_LEADING_ZEROS,
      );

      if (formattedZero === '0') {
        return NON_LOCALIZED_DIGITS;
      }

      return Array.from({ length: 10 }).map((_, index) =>
        adapter.formatByString(adapter.setSeconds(today, index), FORMAT_SECONDS_NO_LEADING_ZEROS),
      );
    },
  ),
  disabled: createSelector((state: State) => state.disabled),
  readOnly: createSelector((state: State) => state.readOnly),
  adapter: createSelector((state: State) => state.adapter),
  manager: createSelector((state: State) => state.manager),
  config: createSelector((state: State) => state.config),
  validationProps: createSelector((state: State) => state.validationProps),
};
