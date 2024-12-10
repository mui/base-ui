'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { valueToPercent } from '../../utils/valueToPercent';

function useMeterRoot(parameters: useMeterRoot.Parameters): useMeterRoot.ReturnValue {
  const {
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-valuetext': ariaValuetext,
    getAriaLabel,
    getAriaValueText,
    max,
    min,
    value,
  } = parameters;

  const percentageValue = valueToPercent(value, min, max);

  const getRootProps: useMeterRoot.ReturnValue['getRootProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        'aria-label': getAriaLabel(value) || ariaLabel,
        'aria-labelledby': ariaLabelledby,
        'aria-valuemax': max,
        'aria-valuemin': min,
        'aria-valuenow': percentageValue / 100,
        'aria-valuetext': getAriaValueText(value) || ariaValuetext || `${percentageValue}%`,
        role: 'meter',
      }),
    [
      ariaLabel,
      ariaLabelledby,
      ariaValuetext,
      getAriaLabel,
      getAriaValueText,
      max,
      min,
      percentageValue,
      value,
    ],
  );

  return {
    getRootProps,
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
    'aria-label': string;
    /**
     * An id or space-separated list of ids of elements that label the Indicator component.
     */
    'aria-labelledby': string;
    /**
     * A string value that provides a human-readable text alternative for the current value of the meter indicator.
     */
    'aria-valuetext': string;
    /**
     * Accepts a function which returns a string value that provides an accessible name for the Indicator component
     * @param {number} value The component's value
     * @returns {string}
     */
    getAriaLabel: (value: number) => string;
    /**
     * Accepts a function which returns a string value that provides a human-readable text alternative for the current value of the meter indicator.
     * @param {number} value The component's numerical value.
     * @returns {string}
     */
    getAriaValueText: (value: number) => string;
    /**
     * The maximum value
     * @default 100
     */
    max: number;
    /**
     * The minimum value
     * @default 0
     */
    min: number;
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
     * Value represented as a percentage of the range between `min` and `max`.
     */
    percentageValue: number;
  }
}

export { useMeterRoot };
