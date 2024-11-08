'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { usePopoverPositionerContext } from '../Positioner/PopoverPositionerContext.js';
import { usePopoverRootContext } from '../Root/PopoverRootContext.js';
import { useComponentRenderer } from '../../utils/useComponentRenderer.js';
import { useForkRef } from '../../utils/useForkRef.js';
import { usePopoverArrow } from './usePopoverArrow.js';
import type { Alignment, Side } from '../../utils/useAnchorPositioning.js';
import type { BaseUIComponentProps } from '../../utils/types.js';
import { popupOpenStateMapping } from '../../utils/popupOpenStateMapping.js';

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
  props: PopoverArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, hideWhenUncentered = false, ...otherProps } = props;

  const { open } = usePopoverRootContext();
  const { arrowRef, side, alignment, arrowUncentered, arrowStyles } = usePopoverPositionerContext();

  const { getArrowProps } = usePopoverArrow({
    arrowStyles,
    hidden: hideWhenUncentered && arrowUncentered,
  });

  const ownerState: PopoverArrow.OwnerState = React.useMemo(
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
    customStyleHookMapping: popupOpenStateMapping,
  });

  return renderElement();
});

namespace PopoverArrow {
  export interface OwnerState {
    open: boolean;
    side: Side;
    alignment: Alignment;
    arrowUncentered: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    /**
     * If `true`, the arrow is hidden when it can't point to the center of the anchor element.
     * @default false
     */
    hideWhenUncentered?: boolean;
  }
}

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
