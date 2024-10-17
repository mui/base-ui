'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { valueToPercent } from '../../utils/valueToPercent';

export type MeterDirection = 'ltr' | 'rtl';

function useMeterRoot(parameters: useMeterRoot.Parameters): useMeterRoot.ReturnValue {
  const {
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-valuetext': ariaValuetext,
    direction = 'ltr',
    getAriaLabel,
    getAriaValueText,
    max = 100,
    min = 0,
    value,
  } = parameters;

  const percentageValue = valueToPercent(value, min, max);

  const getRootProps: useMeterRoot.ReturnValue['getRootProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        'aria-label': getAriaLabel ? getAriaLabel(value) : ariaLabel,
        'aria-labelledby': ariaLabelledby,
        'aria-valuemax': max,
        'aria-valuemin': min,
        'aria-valuenow': percentageValue,
        'aria-valuetext': getAriaValueText
          ? getAriaValueText(value)
          : ariaValuetext ?? `${percentageValue}%`,
        dir: direction,
        role: 'meter',
      }),
    [
      ariaLabel,
      ariaLabelledby,
      ariaValuetext,
      direction,
      getAriaLabel,
      getAriaValueText,
      max,
      min,
      value,
      percentageValue,
    ],
  );

  return {
    getRootProps,
    direction,
    max,
    min,
    value,
    percentageValue,
  };
}

namespace useMeterRoot {
  export interface Parameters {
    /**
     * The label for the Indicator component.
     */
    'aria-label'?: string;
    /**
     * An id or space-separated list of ids of elements that label the Indicator component.
     */
    'aria-labelledby'?: string;
    /**
     * A string value that provides a human-readable text alternative for the current value of the meter indicator.
     */
    'aria-valuetext'?: string;
    /**
     * The direction that the meter fills towards
     * @default 'ltr'
     */
    direction?: MeterDirection;
    /**
     * Accepts a function which returns a string value that provides an accessible name for the Indicator component
     * @param {number} value The component's value
     * @returns {string}
     */
    getAriaLabel?: (value: number) => string;
    /**
     * Accepts a function which returns a string value that provides a human-readable text alternative for the current value of the meter indicator.
     * @param {number} value The component's value to format
     * @returns {string}
     */
    getAriaValueText?: (value: number) => string;
    /**
     * The maximum value
     * @default 100
     */
    max?: number;
    /**
     * The minimum value
     * @default 0
     */
    min?: number;
    /**
     * The current value.
     */
    value: number;
  }

  export interface ReturnValue {
    getRootProps: (
      externalProps?: React.ComponentPropsWithRef<'div'>,
    ) => React.ComponentPropsWithRef<'div'>;
    /**
     * The direction that progress bars fill in
     */
    direction: MeterDirection;
    /**
     * The maximum value
     */
    max: number;
    /**
     * The minimum value
     */
    min: number;
    /**
     * Value of the component
     */
    value: number;
    /**
     * Value represented as a percentage of the range between `min` and `max`
     */
    percentageValue: number;
  }
}

export { useMeterRoot };
