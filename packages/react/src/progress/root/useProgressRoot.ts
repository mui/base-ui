'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';

export type ProgressStatus = 'indeterminate' | 'progressing' | 'complete';

function getDefaultAriaValueText(value: number | null) {
  if (value === null) {
    return 'indeterminate progress';
  }

  return `${value}%`;
}

function useProgressRoot(parameters: useProgressRoot.Parameters): useProgressRoot.ReturnValue {
  const {
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-valuetext': ariaValuetext,
    getAriaLabel,
    getAriaValueText,
    max = 100,
    min = 0,
    value,
  } = parameters;

  let status: ProgressStatus = 'indeterminate';
  if (Number.isFinite(value)) {
    status = value === max ? 'complete' : 'progressing';
  }

  const getRootProps: useProgressRoot.ReturnValue['getRootProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        'aria-label': getAriaLabel ? getAriaLabel(value) : ariaLabel,
        'aria-labelledby': ariaLabelledby,
        'aria-valuemax': max,
        'aria-valuemin': min,
        'aria-valuenow': value ?? undefined,
        'aria-valuetext': getAriaValueText
          ? getAriaValueText(value)
          : (ariaValuetext ?? getDefaultAriaValueText(value)),
        role: 'progressbar',
      }),
    [ariaLabel, ariaLabelledby, ariaValuetext, getAriaLabel, getAriaValueText, max, min, value],
  );

  return {
    getRootProps,

    max,
    min,
    value,
    status,
  };
}

namespace useProgressRoot {
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
     * A string value that provides a human-readable text alternative for the current value of the progress indicator.
     */
    'aria-valuetext'?: string;
    /**
     * Accepts a function which returns a string value that provides an accessible name for the Indicator component
     * @param {number | null} value The component's value
     * @returns {string}
     */
    getAriaLabel?: (index: number | null) => string;
    /**
     * Accepts a function which returns a string value that provides a human-readable text alternative for the current value of the progress indicator.
     * @param {number | null} value The component's value to format
     * @returns {string}
     */
    getAriaValueText?: (value: number | null) => string;
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
     * The current value. The component is indeterminate when value is `null`.
     * @default null
     */
    value: number | null;
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
    value: number | null;
    status: ProgressStatus;
  }
}

export { useProgressRoot };
