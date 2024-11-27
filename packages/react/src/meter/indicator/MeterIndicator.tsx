'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useMeterIndicator } from './useMeterIndicator';
import { MeterRoot } from '../root/MeterRoot';
import { useMeterRootContext } from '../root/MeterRootContext';
import { meterStyleHookMapping } from '../root/styleHooks';
import { BaseUIComponentProps } from '../../utils/types';
/**
 *
 * Demos:
 *
 * - [Meter](https://base-ui.com/components/react-meter/)
 *
 * API:
 *
 * - [MeterIndicator API](https://base-ui.com/components/react-meter/#api-reference-MeterIndicator)
 */
const MeterIndicator = React.forwardRef(function MeterIndicator(
  props: MeterIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, ...otherProps } = props;

  const { percentageValue, state } = useMeterRootContext();

  const { getRootProps } = useMeterIndicator({
    percentageValue,
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'span',
    state,
    className,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping: meterStyleHookMapping,
  });

  return renderElement();
});

namespace MeterIndicator {
  export interface State extends MeterRoot.State {}

  export interface Props extends BaseUIComponentProps<'span', State> {}
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
