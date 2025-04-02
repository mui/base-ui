'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { formatNumber } from '../../utils/formatNumber';
import { mergeProps } from '../../merge-props';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useLatestRef } from '../../utils/useLatestRef';
import { ProgressRootContext } from './ProgressRootContext';
import { progressStyleHookMapping } from './styleHooks';
import { BaseUIComponentProps } from '../../utils/types';

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

/**
 * Groups all parts of the progress bar and provides the task completion status to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
const ProgressRoot = React.forwardRef(function ProgressRoot(
  props: ProgressRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
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
    render,
    className,
    ...otherProps
  } = props;

  const formatOptionsRef = useLatestRef(format);

  let status: ProgressStatus = 'indeterminate';
  if (Number.isFinite(value)) {
    status = value === max ? 'complete' : 'progressing';
  }
  const formattedValue = formatValue(value, formatOptionsRef.current);

  const state: ProgressRoot.State = React.useMemo(
    () => ({
      max,
      min,
      status,
    }),
    [max, min, status],
  );

  const contextValue: ProgressRootContext = React.useMemo(
    () => ({
      max,
      min,
      value,
      formattedValue,
      status,
      state,
    }),
    [max, min, value, formattedValue, status, state],
  );

  const propGetter = React.useCallback(
    (externalProps = {}) =>
      mergeProps<'div'>(
        {
          'aria-label': getAriaLabel ? getAriaLabel(value) : ariaLabel,
          'aria-labelledby': ariaLabelledby,
          'aria-valuemax': max,
          'aria-valuemin': min,
          'aria-valuenow': value ?? undefined,
          'aria-valuetext': getAriaValueText
            ? getAriaValueText(formattedValue, value)
            : (ariaValuetext ?? getDefaultAriaValueText(formattedValue, value)),
          role: 'progressbar',
        },
        otherProps,
        externalProps,
      ),
    [
      ariaLabel,
      ariaLabelledby,
      ariaValuetext,
      formattedValue,
      getAriaLabel,
      getAriaValueText,
      max,
      min,
      otherProps,
      value,
    ],
  );

  const { renderElement } = useComponentRenderer({
    propGetter,
    render: render ?? 'div',
    state,
    className,
    ref: forwardedRef,
    customStyleHookMapping: progressStyleHookMapping,
  });

  return (
    <ProgressRootContext.Provider value={contextValue}>
      {renderElement()}
    </ProgressRootContext.Provider>
  );
});

export type ProgressStatus = 'indeterminate' | 'progressing' | 'complete';

namespace ProgressRoot {
  export type State = {
    max: number;
    min: number;
    status: ProgressStatus;
  };

  export interface Props extends BaseUIComponentProps<'div', State> {
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
}

export { ProgressRoot };

ProgressRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The label for the Indicator component.
   */
  'aria-label': PropTypes.string,
  /**
   * An id or space-separated list of ids of elements that label the Indicator component.
   */
  'aria-labelledby': PropTypes.string,
  /**
   * A string value that provides a human-readable text alternative for the current value of the progress indicator.
   */
  'aria-valuetext': PropTypes.string,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Options to format the value.
   */
  format: PropTypes.shape({
    compactDisplay: PropTypes.oneOf(['long', 'short']),
    currency: PropTypes.string,
    currencyDisplay: PropTypes.oneOf(['code', 'name', 'narrowSymbol', 'symbol']),
    currencySign: PropTypes.oneOf(['accounting', 'standard']),
    localeMatcher: PropTypes.oneOf(['best fit', 'lookup']),
    maximumFractionDigits: PropTypes.number,
    maximumSignificantDigits: PropTypes.number,
    minimumFractionDigits: PropTypes.number,
    minimumIntegerDigits: PropTypes.number,
    minimumSignificantDigits: PropTypes.number,
    notation: PropTypes.oneOf(['compact', 'engineering', 'scientific', 'standard']),
    numberingSystem: PropTypes.string,
    signDisplay: PropTypes.oneOf(['always', 'auto', 'exceptZero', 'never']),
    style: PropTypes.oneOf(['currency', 'decimal', 'percent', 'unit']),
    unit: PropTypes.string,
    unitDisplay: PropTypes.oneOf(['long', 'narrow', 'short']),
    useGrouping: PropTypes.bool,
  }),
  /**
   * Accepts a function which returns a string value that provides an accessible name for the Indicator component.
   * @param {number | null} value The component's value.
   * @returns {string}
   */
  getAriaLabel: PropTypes.func,
  /**
   * Accepts a function which returns a string value that provides a human-readable text alternative for the current value of the progress indicator.
   * @param {string} formattedValue The component's formatted value.
   * @param {number | null} value The component's numerical value.
   * @returns {string}
   */
  getAriaValueText: PropTypes.func,
  /**
   * The maximum value.
   * @default 100
   */
  max: PropTypes.number,
  /**
   * The minimum value.
   * @default 0
   */
  min: PropTypes.number,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The current value. The component is indeterminate when value is `null`.
   * @default null
   */
  value: PropTypes.number,
} as any;
