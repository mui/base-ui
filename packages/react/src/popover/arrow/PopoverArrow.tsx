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
import { popupStateMapping } from '../../utils/popupStateMapping';

/**
 * Displays an element positioned against the popover anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
const PopoverArrow = React.forwardRef(function PopoverArrow(
  props: PopoverArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...otherProps } = props;

  const { open } = usePopoverRootContext();
  const { arrowRef, side, align, arrowUncentered, arrowStyles } = usePopoverPositionerContext();

  const { getArrowProps } = usePopoverArrow({
    arrowStyles,
  });

  const state: PopoverArrow.State = React.useMemo(
    () => ({
      open,
      side,
      align,
      uncentered: arrowUncentered,
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
    customStyleHookMapping: popupStateMapping,
  });

  return renderElement();
});

namespace PopoverArrow {
  export interface State {
    /**
     * Whether the popover is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    uncentered: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
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
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { PopoverArrow };
