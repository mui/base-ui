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
    high: highParam,
    low: lowParam,
    optimum,
    value,
  } = parameters;

  const percentageValue = valueToPercent(value, min, max);

  const high = Number.isNaN(highParam) ? max : highParam;
  const low = Number.isNaN(lowParam) ? min : lowParam;

  let segment: useMeterRoot.Segment | undefined;

  if (value <= low) {
    segment = 'low';
  } else if (value >= high) {
    segment = 'high';
  } else {
    segment = 'medium';
  }

  // 'low' is preferred if `min <= optimum <= low`
  // 'high' is preferred if `high <= optimum <= max`
  let isOptimal = false;

  if (!Number.isNaN(optimum)) {
    if (min <= optimum && optimum <= low) {
      isOptimal = segment === 'low';
    } else if (high <= optimum && optimum <= max) {
      isOptimal = segment === 'high';
    }
  }

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
      value,
      percentageValue,
    ],
  );

  return {
    getRootProps,
    max,
    min,
    value,
    percentageValue,
    segment,
    isOptimal,
  };
}

namespace useMeterRoot {
  export type Segment = 'low' | 'medium' | 'high';

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
     * @param {number} value The component's value to format
     * @returns {string}
     */
    getAriaValueText: (value: number) => string;
    /**
     * Sets the lower boundary of the high end of the numeric range represented by the component.
     * If unspecified, or greater than `max`, it will fall back to `max`.
     * @default 100
     */
    high: number;
    /**
     * Sets the upper boundary of the low end of the numeric range represented by the component.
     * If unspecified, or less than `min`, it will fall back to `min`.
     * @default 0
     */
    low: number;
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
     * Indicates the optimal point in the numeric range represented by the component.
     */
    optimum: number;
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
    /**
     * Which segment the value falls in, where the segment boundaries are defined
     * by the `min`, `max`, `high`, `low`, and `optimum` props.
     */
    segment: Segment;
    /**
     * Whether the value is in the preferred end - higher or lower values - of
     * the numeric range represented by the component.
     */
    isOptimal: boolean;
  }
}

export { useMeterRoot };
