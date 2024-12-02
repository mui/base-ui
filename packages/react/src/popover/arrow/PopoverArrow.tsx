'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { usePopoverPositionerContext } from '../positioner/PopoverPositionerContext';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import { usePopoverArrow } from './usePopoverArrow';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';
import { popupOpenStateMapping } from '../../utils/popupOpenStateMapping';

/**
 * Renders an arrow that points to the center of the anchor element.
 *
 * Demos:
 *
 * - [Popover](https://base-ui.com/components/react-popover/)
 *
 * API:
 *
 * - [PopoverArrow API](https://base-ui.com/components/react-popover/#api-reference-PopoverArrow)
 */
const PopoverArrow = React.forwardRef(function PopoverArrow(
  props: PopoverArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, hideWhenUncentered = false, ...otherProps } = props;

  const { open } = usePopoverRootContext();
  const { arrowRef, side, align, arrowUncentered, arrowStyles } = usePopoverPositionerContext();

  const { getArrowProps } = usePopoverArrow({
    arrowStyles,
    hidden: hideWhenUncentered && arrowUncentered,
  });

  const state: PopoverArrow.State = React.useMemo(
    () => ({
      open,
      side,
      align,
      arrowUncentered,
    }),
    [open, side, align, arrowUncentered],
  );

  const mergedRef = useForkRef(arrowRef, forwardedRef);

  const { renderElement } = useComponentRenderer({
    propGetter: getArrowProps,
    render: render ?? 'div',
    className,
    state,
    ref: mergedRef,
    extraProps: otherProps,
    customStyleHookMapping: popupOpenStateMapping,
  });

  return renderElement();
});

namespace PopoverArrow {
  export interface State {
    open: boolean;
    side: Side;
    align: Align;
    arrowUncentered: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
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
