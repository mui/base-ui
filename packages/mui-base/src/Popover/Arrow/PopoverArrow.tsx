'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { PopoverArrowOwnerState, PopoverArrowProps } from './PopoverArrow.types';
import { usePopoverPositionerContext } from '../Positioner/PopoverPositionerContext';
import { usePopoverRootContext } from '../Root/PopoverRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';

/**
 * The tooltip arrow caret element.
 *
 * Demos:
 *
 * - [Tooltip](https://mui.com/base-ui/react-tooltip/)
 *
 * API:
 *
 * - [PopoverArrow API](https://mui.com/base-ui/react-tooltip/components-api/#tooltip-arrow)
 */
const PopoverArrow = React.forwardRef(function PopoverArrow(
  props: PopoverArrowProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, hideWhenUncentered = false, ...otherProps } = props;

  const { open } = usePopoverRootContext();
  const { arrowRef, side, alignment, arrowUncentered, getArrowProps } =
    usePopoverPositionerContext();

  const ownerState: PopoverArrowOwnerState = React.useMemo(
    () => ({
      open,
      side,
      alignment,
      arrowUncentered,
    }),
    [open, side, alignment, arrowUncentered],
  );

  const mergedRef = useForkRef(arrowRef, forwardedRef);

  const { renderElement } = useComponentRenderer({
    propGetter: getArrowProps,
    render: render ?? 'div',
    className,
    ownerState,
    ref: mergedRef,
    extraProps: {
      ...otherProps,
      style: {
        ...(hideWhenUncentered && arrowUncentered && { visibility: 'hidden' }),
        ...otherProps.style,
      },
    },
    customStyleHookMapping: {
      open(value) {
        return {
          'data-state': value ? 'open' : 'closed',
        };
      },
    },
  });

  return renderElement();
});

PopoverArrow.propTypes /* remove-proptypes */ = {
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
   * If `true`, the arrow is hidden when it can't point to the center of the anchor element.
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

export { PopoverArrow };
