'use client';
import * as React from 'react';
import { usePopoverPositionerContext } from '../positioner/PopoverPositionerContext';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import type { Align, Side } from '../../internals/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../internals/types';
import { usePopupArrow } from '../../utils/popups/popupParts';

/**
 * Displays an element positioned against the popover anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export const PopoverArrow = React.forwardRef(function PopoverArrow(
  componentProps: PopoverArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const store = usePopoverRootContext();
  return usePopupArrow(
    componentProps,
    forwardedRef,
    store.useState('open'),
    usePopoverPositionerContext(),
  );
});

export interface PopoverArrowState {
  /**
   * Whether the popover is currently open.
   */
  open: boolean;
  /**
   * The side of the anchor the component is placed on.
   */
  side: Side;
  /**
   * The alignment of the component relative to the anchor.
   */
  align: Align;
  /**
   * Whether the arrow cannot be centered on the anchor.
   */
  uncentered: boolean;
}

export interface PopoverArrowProps extends BaseUIComponentProps<'div', PopoverArrowState> {}

export namespace PopoverArrow {
  export type State = PopoverArrowState;
  export type Props = PopoverArrowProps;
}
