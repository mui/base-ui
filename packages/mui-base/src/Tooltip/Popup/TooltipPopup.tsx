'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { TooltipPopupOwnerState, TooltipPopupProps } from './TooltipPopup.types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { tooltipPopupStyleHookMapping } from './styleHooks';
import { useTooltipRootContext } from '../Root/TooltipRootContext';
import { useTooltipPositionerContext } from '../Positioner/TooltipPositionerContext';

/**
 * The tooltip popup element.
 *
 * Demos:
 *
 * - [Tooltip](https://mui.com/base-ui/react-tooltip/)
 *
 * API:
 *
 * - [TooltipPopup API](https://mui.com/base-ui/react-tooltip/components-api/#tooltip-popup)
 */
const TooltipPopup = React.forwardRef(function TooltipPopup(
  props: TooltipPopupProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...otherProps } = props;

  const { open, instantType, transitionStatus } = useTooltipRootContext();
  const { side, alignment } = useTooltipPositionerContext();

  const ownerState: TooltipPopupOwnerState = React.useMemo(
    () => ({
      open,
      side,
      alignment,
      instant: instantType,
      entering: transitionStatus === 'entering',
      exiting: transitionStatus === 'exiting',
    }),
    [open, side, alignment, instantType, transitionStatus],
  );

  // The content element needs to be a child of a wrapper floating element in order to avoid
  // conflicts with CSS transitions and the positioning transform.
  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    ownerState,
    extraProps: {
      ...otherProps,
      style: {
        // <Tooltip.Arrow> must be relative to the inner popup element.
        position: 'relative',
        ...otherProps.style,
      },
    },
    ref: forwardedRef,
    customStyleHookMapping: tooltipPopupStyleHookMapping,
  });

  return renderElement();
});

TooltipPopup.propTypes /* remove-proptypes */ = {
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
  /**
   * @ignore
   */
  style: PropTypes.object,
} as any;

export { TooltipPopup };
