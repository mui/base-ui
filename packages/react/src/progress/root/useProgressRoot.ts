'use client';
import * as React from 'react';
import { formatNumber } from '../../utils/formatNumber';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useLatestRef } from '../../utils/useLatestRef';

export type ProgressStatus = 'indeterminate' | 'progressing' | 'complete';

function formatValue(value: number | null, format?: Intl.NumberFormatOptions): string {
  if (value == null) {
    return '';
  }

  if (!format) {
    return formatNumber(value / 100, [], { style: 'percent' });
  }

  return formatNumber(value, [], format);
}

function getDefaultAriaValueText(formattedValue: string | null, value: number | null) {
  if (value == null) {
    return 'indeterminate progress';
  }

  return formattedValue || `${value}%`;
}

function useProgressRoot(parameters: useProgressRoot.Parameters): useProgressRoot.ReturnValue {
  const {
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-valuetext': ariaValuetext,
    format,
    getAriaLabel,
    getAriaValueText,
    max = 100,
    min = 0,
    value,
  } = parameters;

  const formatOptionsRef = useLatestRef(format);

  let status: ProgressStatus = 'indeterminate';
  if (Number.isFinite(value)) {
    status = value === max ? 'complete' : 'progressing';
  }
  const formattedValue = formatValue(value, formatOptionsRef.current);

  const getRootProps: useProgressRoot.ReturnValue['getRootProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        'aria-label': getAriaLabel ? getAriaLabel(value) : ariaLabel,
        'aria-labelledby': ariaLabelledby,
        'aria-valuemax': max,
        'aria-valuemin': min,
        'aria-valuenow': value ?? undefined,
        'aria-valuetext': getAriaValueText
          ? getAriaValueText(formattedValue, value)
          : (ariaValuetext ?? getDefaultAriaValueText(formattedValue, value)),
        role: 'progressbar',
      }),
    [
      ariaLabel,
      ariaLabelledby,
      ariaValuetext,
      formattedValue,
      getAriaLabel,
      getAriaValueText,
      max,
      min,
      value,
    ],
  );

  return {
    getRootProps,
    formattedValue,
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
     * Options to format the value.
     */
    format?: Intl.NumberFormatOptions;
    /**
     * Accepts a function which returns a string value that provides an accessible name for the Indicator component.
     * @param {number | null} value The component's value.
     * @returns {string}
     */
    getAriaLabel?: (index: number | null) => string;
    /**
     * Accepts a function which returns a string value that provides a human-readable text alternative for the current value of the progress indicator.
     * @param {string} formattedValue The component's formatted value.
     * @param {number | null} value The component's numerical value.
     * @returns {string}
     */
    getAriaValueText?: (formattedValue: string | null, value: number | null) => string;
    /**
     * The maximum value.
     * @default 100
     */
    max?: number;
    /**
     * The minimum value.
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
     * The maximum value.
     */
    max: number;
    /**
     * The minimum value.
     */
    min: number;
    /**
     * Value of the component.
     */
    value: number | null;
    /**
     * Formatted value of the component.
     */
    formattedValue: string;
    status: ProgressStatus;
  }
}

export { useProgressRoot };
