'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useMeterRoot } from './useMeterRoot';
import { MeterRootContext } from './MeterRootContext';
import { BaseUIComponentProps } from '../../utils/types';
import { meterStyleHookMapping } from './styleHooks';
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

  const { getRootProps, ...meter } = useMeterRoot({
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-valuetext': ariaValuetext,
    format,
    getAriaLabel,
    getAriaValueText,
    max,
    min,
    value,
  });

  const state: MeterRoot.State = React.useMemo(
    () => ({
      max,
      min,
    }),
    [max, min],
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
  };

  export interface Props extends useMeterRoot.Parameters, BaseUIComponentProps<'div', State> {}
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
