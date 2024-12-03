'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useMeterRoot } from './useMeterRoot';
import { MeterRootContext } from './MeterRootContext';
import { BaseUIComponentProps } from '../../utils/types';
import { meterStyleHookMapping } from './styleHooks';

function NOOP() {
  return '';
}

/**
 *
 * Demos:
 *
 * - [Meter](https://base-ui.com/components/react-meter/)
 *
 * API:
 *
 * - [MeterRoot API](https://base-ui.com/components/react-meter/#api-reference-MeterRoot)
 */
const MeterRoot = React.forwardRef(function MeterRoot(
  props: MeterRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-valuetext': ariaValuetext,
    getAriaLabel: getAriaLabelProp,
    getAriaValueText: getAriaValueTextProp,
    max = 100,
    min = 0,
    low,
    high,
    optimum,
    value,
    render,
    className,
    ...otherProps
  } = props;

  const { getRootProps, ...meter } = useMeterRoot({
    'aria-label': ariaLabel ?? '',
    'aria-labelledby': ariaLabelledby ?? '',
    'aria-valuetext': ariaValuetext ?? '',
    getAriaLabel: getAriaLabelProp ?? NOOP,
    getAriaValueText: getAriaValueTextProp ?? NOOP,
    max,
    min,
    low: low ?? min,
    high: high ?? max,
    optimum: optimum ?? NaN,
    value,
  });

  const state: MeterRoot.State = React.useMemo(
    () => ({
      max,
      min,
      segment: meter.segment,
      isOptimal: meter.isOptimal,
    }),
    [max, min, meter.segment, meter.isOptimal],
  );

  const contextValue: MeterRootContext = React.useMemo(
    () => ({
      ...meter,
      state,
    }),
    [meter, state],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
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
    segment: useMeterRoot.Segment;
    isOptimal: boolean;
  };

  export interface Props
    extends Partial<Omit<useMeterRoot.Parameters, 'value'>>,
      BaseUIComponentProps<'div', State> {
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
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
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
   * Sets the lower boundary of the high end of the numeric range represented by the component.
   * If unspecified, or greater than `max`, it will fall back to `max`.
   * @default 100
   */
  high: PropTypes.number,
  /**
   * Sets the upper boundary of the low end of the numeric range represented by the component.
   * If unspecified, or less than `min`, it will fall back to `min`.
   * @default 0
   */
  low: PropTypes.number,
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
   * Indicates the optimal point in the numeric range represented by the component.
   */
  optimum: PropTypes.number,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The current value.
   */
  value: PropTypes.number.isRequired,
} as any;
