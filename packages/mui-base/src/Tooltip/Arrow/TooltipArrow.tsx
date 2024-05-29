'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { TooltipArrowOwnerState, TooltipArrowProps } from './TooltipArrow.types';
import { tooltipArrowStyleHookMapping } from './styleHooks';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import { useTooltipPositionerContext } from '../Positioner/TooltipPositionerContext';

/**
 * The tooltip arrow caret element.
 *
 * Demos:
 *
 * - [Tooltip](https://mui.com/base-ui/react-tooltip/)
 *
 * API:
 *
 * - [TooltipArrow API](https://mui.com/base-ui/react-tooltip/components-api/#tooltip-arrow)
 */
const TooltipArrow = React.forwardRef(function TooltipArrow(
  props: TooltipArrowProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, hideWhenUncentered = false, ...otherProps } = props;

  const { open, arrowRef, side, alignment, arrowUncentered, getArrowProps } =
    useTooltipPositionerContext();

  const ownerState: TooltipArrowOwnerState = React.useMemo(
    () => ({
      open,
      side,
      alignment,
    }),
    [open, side, alignment],
  );

  const mergedRef = useForkRef(arrowRef, forwardedRef);

  const { renderElement } = useComponentRenderer({
    propGetter: getArrowProps,
    render: render ?? 'div',
    ownerState,
    className,
    ref: mergedRef,
    extraProps: {
      ...otherProps,
      style: {
        ...(hideWhenUncentered && arrowUncentered && { visibility: 'hidden' }),
        ...otherProps.style,
      },
    },
    customStyleHookMapping: tooltipArrowStyleHookMapping,
  });

  return renderElement();
});

TooltipArrow.propTypes /* remove-proptypes */ = {
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
   * If `true`, the arrow will be hidden when it can't point to the center of the anchor element.
   * @default false
   */
  hideWhenUncentered: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  style: PropTypes.object,
} as any;

export { TooltipArrow };
