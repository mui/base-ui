'use client';
import * as React from 'react';
import { usePopoverPositionerContext } from '../positioner/PopoverPositionerContext';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * Displays an element positioned against the popover anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
const PopoverArrow = React.forwardRef(function PopoverArrow(
  componentProps: PopoverArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const { open } = usePopoverRootContext();
  const { arrowRef, side, align, arrowUncentered, arrowStyles } = usePopoverPositionerContext();

  const state: PopoverArrow.State = React.useMemo(
    () => ({
      open,
      side,
      align,
      uncentered: arrowUncentered,
    }),
    [open, side, align, arrowUncentered],
  );

  const renderElement = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, arrowRef],
    props: [{ style: arrowStyles, 'aria-hidden': true }, elementProps],
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

export { PopoverArrow };
