'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { ProgressStatus, useProgressRoot } from './useProgressRoot';
import { ProgressRootContext } from './ProgressRootContext';
import { progressStyleHookMapping } from './styleHooks';
import { BaseUIComponentProps } from '../../utils/types';

/**
 *
 * Demos:
 *
 * - [Progress](https://base-ui.com/components/react-progress/)
 *
 * API:
 *
 * - [ProgressRoot API](https://base-ui.com/components/react-progress/#api-reference-ProgressRoot)
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

  const { getRootProps, ...progress } = useProgressRoot({
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

  const state: ProgressRoot.State = React.useMemo(
    () => ({
      max,
      min,
      status: progress.status,
    }),
    [max, min, progress.status],
  );

  const contextValue: ProgressRootContext = React.useMemo(
    () => ({
      ...progress,
      state,
    }),
    [progress, state],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    state,
    className,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping: progressStyleHookMapping,
  });

  return (
    <ProgressRootContext.Provider value={contextValue}>
      {renderElement()}
    </ProgressRootContext.Provider>
  );
});

namespace ProgressRoot {
  export type State = {
    max: number;
    min: number;
    status: ProgressStatus;
  };

  export interface Props extends useProgressRoot.Parameters, BaseUIComponentProps<'div', State> {}
}

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
   * Class names applied to the element or a function that returns them based on the component's state.
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
   * @param {number | null} value The component's value
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
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The current value. The component is indeterminate when value is `null`.
   * @default null
   */
  value: PropTypes.number,
} as any;

export { ProgressRoot };
