'use client';
import * as React from 'react';
import { formatNumber } from '../../utils/formatNumber';
import { useRenderElement } from '../../utils/useRenderElement';
import { useLatestRef } from '../../utils/useLatestRef';
import { ProgressRootContext } from './ProgressRootContext';
import { progressStyleHookMapping } from './styleHooks';
import { BaseUIComponentProps } from '../../utils/types';

function formatValue(
  value: number | null,
  locale?: Intl.LocalesArgument,
  format?: Intl.NumberFormatOptions,
): string {
  if (value == null) {
    return '';
  }

  if (!format) {
    return formatNumber(value / 100, locale, { style: 'percent' });
  }

  return formatNumber(value, locale, format);
}

function getDefaultAriaValueText(formattedValue: string | null, value: number | null) {
  if (value == null) {
    return 'indeterminate progress';
  }

  return formattedValue || `${value}%`;
}

/**
 * Groups all parts of the progress bar and provides the task completion status to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
export const ProgressRoot = React.forwardRef(function ProgressRoot(
  componentProps: ProgressRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    format,
    getAriaValueText,
    locale,
    max = 100,
    min = 0,
    value,
    render,
    className,
    ...elementProps
  } = componentProps;

  const [labelId, setLabelId] = React.useState<string | undefined>();

  const formatOptionsRef = useLatestRef(format);

  let status: ProgressStatus = 'indeterminate';
  if (Number.isFinite(value)) {
    status = value === max ? 'complete' : 'progressing';
  }
  const formattedValue = formatValue(value, locale, formatOptionsRef.current);

  const state: ProgressRoot.State = React.useMemo(
    () => ({
      status,
    }),
    [status],
  );

  const contextValue: ProgressRootContext = React.useMemo(
    () => ({
      formattedValue,
      max,
      min,
      setLabelId,
      state,
      status,
      value,
    }),
    [formattedValue, max, min, setLabelId, state, status, value],
  );

  const renderElement = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      {
        'aria-labelledby': labelId,
        'aria-valuemax': max,
        'aria-valuemin': min,
        'aria-valuenow': value ?? undefined,
        'aria-valuetext': getAriaValueText
          ? getAriaValueText(formattedValue, value)
          : (componentProps['aria-valuetext'] ?? getDefaultAriaValueText(formattedValue, value)),
        role: 'progressbar',
      },
      elementProps,
    ],
    customStyleHookMapping: progressStyleHookMapping,
  });

  return (
    <ProgressRootContext.Provider value={contextValue}>
      {renderElement()}
    </ProgressRootContext.Provider>
  );
});

export type ProgressStatus = 'indeterminate' | 'progressing' | 'complete';

export namespace ProgressRoot {
  export type State = {
    status: ProgressStatus;
  };

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Options to format the value.
     */
    format?: Intl.NumberFormatOptions;
    /**
     * Accepts a function which returns a string value that provides a human-readable text alternative for the current value of the progress bar.
     * @param {string} formattedValue The component's formatted value.
     * @param {number | null} value The component's numerical value.
     * @returns {string}
     */
    getAriaValueText?: (formattedValue: string | null, value: number | null) => string;
    /**
     * The locale used by `Intl.NumberFormat` when formatting the value.
     * Defaults to the user's runtime locale.
     */
    locale?: Intl.LocalesArgument;
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
}
