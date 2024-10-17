'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { type MeterDirection, useMeterRoot } from './useMeterRoot';
import { MeterRootContext } from './MeterRootContext';
import { BaseUIComponentProps } from '../../utils/types';
/**
 *
 * Demos:
 *
 * - [Meter](https://base-ui.netlify.app/components/react-meter/)
 *
 * API:
 *
 * - [MeterRoot API](https://base-ui.netlify.app/components/react-meter/#api-reference-MeterRoot)
 */
const MeterRoot = React.forwardRef(function MeterRoot(
  props: MeterRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-valuetext': ariaValuetext,
    direction = 'ltr',
    getAriaLabel,
    getAriaValueText,
    max = 100,
    min = 0,
    value,
    render,
    className,
    ...otherProps
  } = props;

  const { getRootProps, ...progress } = useMeterRoot({
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-valuetext': ariaValuetext,
    direction,
    getAriaLabel,
    getAriaValueText,
    max,
    min,
    value,
  });

  const ownerState: MeterRoot.OwnerState = React.useMemo(
    () => ({
      direction,
      max,
      min,
    }),
    [direction, max, min],
  );

  const contextValue: MeterRootContext = React.useMemo(
    () => ({
      ...progress,
      ownerState,
    }),
    [progress, ownerState],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    ownerState,
    className,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping: {
      direction: () => null,
      max: () => null,
      min: () => null,
    },
  });

  return (
    <MeterRootContext.Provider value={contextValue}>{renderElement()}</MeterRootContext.Provider>
  );
});

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
   * The direction that the meter fills towards
   * @default 'ltr'
   */
  direction: PropTypes.oneOf(['ltr', 'rtl']),
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
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The current value.
   */
  value: PropTypes.number.isRequired,
} as any;

namespace MeterRoot {
  export type OwnerState = {
    direction: MeterDirection;
    max: number;
    min: number;
  };

  export interface Props extends useMeterRoot.Parameters, BaseUIComponentProps<'div', OwnerState> {}
}

export { MeterRoot };
