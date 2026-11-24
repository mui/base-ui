'use client';
import * as React from 'react';
import { useTooltipPositionerContext } from '../positioner/TooltipPositionerContext';
import type { BaseUIComponentProps } from '../../internals/types';
import type { Side, Align } from '../../internals/useAnchorPositioning';
import { usePopupArrow } from '../../utils/popups/popupParts';
import { useTooltipRootContext } from '../root/TooltipRootContext';

/**
 * Displays an element positioned against the tooltip anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export const TooltipArrow = React.forwardRef(function TooltipArrow(
  componentProps: TooltipArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const store = useTooltipRootContext();
  const open = store.useState('open');
  const instant = store.useState('instantType');

  return usePopupArrow(componentProps, forwardedRef, open, useTooltipPositionerContext(), {
    state: { instant },
  });
});

export interface TooltipArrowState {
  /**
   * Whether the tooltip is currently open.
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
  /**
   * Whether transitions should be skipped.
   */
  instant: 'delay' | 'dismiss' | 'focus' | undefined;
}

export interface TooltipArrowProps extends BaseUIComponentProps<'div', TooltipArrowState> {}

export namespace TooltipArrow {
  export type State = TooltipArrowState;
  export type Props = TooltipArrowProps;
}
