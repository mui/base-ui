'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useMeterIndicator } from './useMeterIndicator';
import { MeterRoot } from '../Root/MeterRoot';
import { useMeterRootContext } from '../Root/MeterRootContext';
import { meterStyleHookMapping } from '../Root/styleHooks';
import { BaseUIComponentProps } from '../../utils/types';
/**
 *
 * Demos:
 *
 * - [Meter](https://base-ui.netlify.app/components/react-meter/)
 *
 * API:
 *
 * - [MeterIndicator API](https://base-ui.netlify.app/components/react-meter/#api-reference-MeterIndicator)
 */
const MeterIndicator = React.forwardRef(function MeterIndicator(
  props: MeterIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, ...otherProps } = props;

  const { direction, percentageValue, ownerState } = useMeterRootContext();

  const { getRootProps } = useMeterIndicator({
    direction,
    percentageValue,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'span',
    ownerState,
    className,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping: meterStyleHookMapping,
  });

  return renderElement();
});

namespace MeterIndicator {
  export interface OwnerState extends MeterRoot.OwnerState {}

  export interface Props extends BaseUIComponentProps<'span', OwnerState> {}
}

export { MeterIndicator };

MeterIndicator.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;
