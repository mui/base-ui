import { TemporalNonRangeValue } from '../../models';
import { areDatesEqual, getTodayDate, replaceInvalidDateByNull } from './date-helpers';
import { getDefaultReferenceDate } from './getDefaultReferenceDate';
import { TemporalValueManager } from './types';

export const nonRangeTemporalValueManager: TemporalValueManager<TemporalNonRangeValue, any> = {
  emptyValue: null,
  getTodayValue: getTodayDate,
  getInitialReferenceValue: ({ value, referenceDate, ...params }) => {
    if (params.adapter.isValid(value)) {
      return value;
    }

    if (referenceDate != null) {
      return referenceDate;
    }

    return getDefaultReferenceDate(params);
  },
  cleanValue: replaceInvalidDateByNull,
  areValuesEqual: areDatesEqual,
  isSameError: (a, b) => a === b,
  hasError: (error) => error != null,
  defaultErrorState: null,
  getTimezone: (adapter, value) => (adapter.isValid(value) ? adapter.getTimezone(value) : null),
  setTimezone: (adapter, timezone, value) =>
    value == null ? null : adapter.setTimezone(value, timezone),
};
