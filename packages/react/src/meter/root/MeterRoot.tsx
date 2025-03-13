'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { MeterRootContext } from './MeterRootContext';
import { mergeProps } from '../../merge-props';
import { BaseUIComponentProps } from '../../utils/types';
import { formatNumber } from '../../utils/formatNumber';
import { useLatestRef } from '../../utils/useLatestRef';
import { valueToPercent } from '../../utils/valueToPercent';
import { meterStyleHookMapping } from './styleHooks';

function formatValue(value: number, format?: Intl.NumberFormatOptions): string {
  if (!format) {
    return formatNumber(value / 100, [], { style: 'percent' });
  }

  return formatNumber(value, [], format);
}
/**
 * Groups all parts of the meter and provides the value for screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
const MeterRoot = React.forwardRef(function MeterRoot(
  props: MeterRoot.Props,
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

  const percentageValue = valueToPercent(value, min, max);

  const formattedValue = formatValue(value, formatOptionsRef.current);

  const propGetter = React.useCallback(
    (externalProps = {}) =>
      mergeProps<'div'>(
        {
          'aria-label': getAriaLabel ? getAriaLabel(value) : ariaLabel,
          'aria-labelledby': ariaLabelledby,
          'aria-valuemax': max,
          'aria-valuemin': min,
          'aria-valuenow': percentageValue / 100,
          'aria-valuetext': getAriaValueText
            ? getAriaValueText(value)
            : (ariaValuetext ?? `${percentageValue}%`),
          role: 'meter',
        },
        externalProps,
      ),
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

  const state: MeterRoot.State = React.useMemo(
    () => ({
      max,
      min,
    }),
    [max, min],
  );

  const contextValue: MeterRootContext = React.useMemo(
    () => ({
      max,
      min,
      value,
      percentageValue,
      formattedValue,
      state,
    }),
    [max, min, value, percentageValue, formattedValue, state],
  );

  const { renderElement } = useComponentRenderer({
    propGetter,
    render: render ?? 'div',
    state,
    className,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping: meterStyleHookMapping,
  });

  return (
    <MeterRootContext.Provider value={contextValue}>{renderElement()}</MeterRootContext.Provider>
  );
});

namespace MeterRoot {
  export type State = {
    max: number;
    min: number;
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
     * A string value that provides a human-readable text alternative for the current value of the meter indicator.
     */
    'aria-valuetext'?: string;
    /**
     * Options to format the value.
     */
    format?: Intl.NumberFormatOptions;
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
}

export { MeterRoot };

MeterRoot.propTypes /* remove-proptypes */ = {
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
   * A string value that provides a human-readable text alternative for the current value of the meter indicator.
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
   * Accepts a function which returns a string value that provides an accessible name for the Indicator component
   * @param {number} value The component's value
   * @returns {string}
   */
  getAriaLabel: PropTypes.func,
  /**
   * Accepts a function which returns a string value that provides a human-readable text alternative for the current value of the meter indicator.
   * @param {number} value The component's value to format
   * @returns {string}
   */
  getAriaValueText: PropTypes.func,
  /**
   * The maximum value
   * @default 100
   */
  max: PropTypes.number,
  /**
   * The minimum value
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
   * The current value.
   */
  value: PropTypes.number.isRequired,
} as any;
