import * as React from 'react';
import { useEventCallback } from '../useEventCallback';
import { useControlled } from '../useControlled';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';
import { TemporalTimezone, TemporalSupportedValue, TemporalSupportedObject } from '../../models';
import { TemporalManager } from './types';

/**
 * Hooks controlling the value while making sure that:
 * - The value returned by `onChange` always have the timezone of `props.value` or `props.defaultValue` if defined
 * - The value rendered is always the one from `props.timezone` if defined
 */
export const useTemporalControlledValue = <
  TValue extends TemporalSupportedValue,
  TChange extends (...params: any[]) => void,
>({
  name,
  timezone: timezoneProp,
  value: valueProp,
  defaultValue,
  referenceDate,
  onChange: onChangeProp,
  manager: { internal_valueManager: valueManager },
}: UseControlledValueWithTimezoneParameters<TValue, TChange>) => {
  const utils = useTemporalAdapter();

  const [valueWithInputTimezone, setValue] = useControlled({
    name,
    state: 'value',
    controlled: valueProp,
    default: defaultValue ?? valueManager.emptyValue,
  });

  const inputTimezone = React.useMemo(
    () => valueManager.getTimezone(utils, valueWithInputTimezone),
    [utils, valueManager, valueWithInputTimezone],
  );

  const setInputTimezone = useEventCallback((newValue: TValue) => {
    if (inputTimezone == null) {
      return newValue;
    }

    return valueManager.setTimezone(utils, inputTimezone, newValue);
  });

  const timezoneToRender = React.useMemo(() => {
    if (timezoneProp) {
      return timezoneProp;
    }
    if (inputTimezone) {
      return inputTimezone;
    }
    if (referenceDate) {
      return utils.getTimezone(referenceDate);
    }
    return 'default';
  }, [timezoneProp, inputTimezone, referenceDate, utils]);

  const valueWithTimezoneToRender = React.useMemo(
    () => valueManager.setTimezone(utils, timezoneToRender, valueWithInputTimezone),
    [valueManager, utils, timezoneToRender, valueWithInputTimezone],
  );

  const handleValueChange = useEventCallback((newValue: TValue, ...otherParams: any[]) => {
    const newValueWithInputTimezone = setInputTimezone(newValue);
    setValue(newValueWithInputTimezone);
    onChangeProp?.(newValueWithInputTimezone, ...otherParams);
  }) as TChange;

  return {
    value: valueWithTimezoneToRender,
    handleValueChange,
    timezone: timezoneToRender,
  };
};

interface UseValueWithTimezoneParameters<
  TValue extends TemporalSupportedValue,
  TChange extends (...params: any[]) => void,
> {
  timezone: TemporalTimezone | undefined;
  value: TValue | undefined;
  defaultValue: TValue | undefined;
  /**
   * The reference date as passed to `props.referenceDate`.
   * It does not need to have its default value.
   * This is only used to determine the timezone to use when `props.value` and `props.defaultValue` are not defined.
   */
  referenceDate: TemporalSupportedObject | undefined;
  onChange: TChange | undefined;
  manager: TemporalManager<TValue, any, any>;
}

interface UseControlledValueWithTimezoneParameters<
  TValue extends TemporalSupportedValue,
  TChange extends (...params: any[]) => void,
> extends UseValueWithTimezoneParameters<TValue, TChange> {
  name: string;
}
