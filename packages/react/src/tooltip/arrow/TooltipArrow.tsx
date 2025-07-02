'use client';
import * as React from 'react';
import { useTooltipPositionerContext } from '../positioner/TooltipPositionerContext';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Side, Align } from '../../utils/useAnchorPositioning';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { useRenderElement } from '../../utils/useRenderElement';

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
  const { className, render, ...elementProps } = componentProps;

  const { open, arrowRef, side, align, arrowUncentered, arrowStyles } =
    useTooltipPositionerContext();

  const state: TooltipArrow.State = React.useMemo(
    () => ({
      open,
      side,
      align,
      uncentered: arrowUncentered,
    }),
    [open, side, align, arrowUncentered],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, arrowRef],
    props: [{ style: arrowStyles, 'aria-hidden': true }, elementProps],
    customStyleHookMapping: popupStateMapping,
  });

  return element;
});

export namespace TooltipArrow {
  export interface State {
    /**
     * Whether the tooltip is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    uncentered: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
