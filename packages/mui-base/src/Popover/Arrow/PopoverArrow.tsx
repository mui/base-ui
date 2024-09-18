'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { PopoverArrowOwnerState, PopoverArrowProps } from './PopoverArrow.types';
import { usePopoverPositionerContext } from '../Positioner/PopoverPositionerContext';
import { usePopoverRootContext } from '../Root/PopoverRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import { usePopoverArrow } from './usePopoverArrow';

/**
 * Renders an arrow that points to the center of the anchor element.
 *
 * Demos:
 *
 * - [Popover](https://base-ui.netlify.app/components/react-popover/)
 *
 * API:
 *
 * - [PopoverArrow API](https://base-ui.netlify.app/components/react-popover/#api-reference-PopoverArrow)
 */
const PopoverArrow = React.forwardRef(function PopoverArrow(
  props: PopoverArrowProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, hideWhenUncentered = false, ...otherProps } = props;

  const { open } = usePopoverRootContext();
  const { arrowRef, side, alignment, arrowUncentered, arrowStyles } = usePopoverPositionerContext();

  const { getArrowProps } = usePopoverArrow({
    arrowStyles,
    hidden: hideWhenUncentered && arrowUncentered,
  });

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
    extraProps: otherProps,
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
} as any;

export { PopoverArrow };
