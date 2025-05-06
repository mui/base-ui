'use client';
import * as React from 'react';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import { TooltipPositionerContext } from './TooltipPositionerContext';
import { useTooltipPositioner } from './useTooltipPositioner';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Side, Align } from '../../utils/useAnchorPositioning';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { useTooltipPortalContext } from '../portal/TooltipPortalContext';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * Positions the tooltip against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export const TooltipPositioner = React.forwardRef(function TooltipPositioner(
  componentProps: TooltipPositioner.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    anchor,
    positionMethod = 'absolute',
    side = 'top',
    align = 'center',
    sideOffset = 0,
    alignOffset = 0,
    collisionBoundary = 'clipping-ancestors',
    collisionPadding = 5,
    arrowPadding = 5,
    sticky = false,
    trackAnchor = true,
    ...elementProps
  } = componentProps;

  const { open, setPositionerElement, mounted, floatingRootContext } = useTooltipRootContext();
  const keepMounted = useTooltipPortalContext();

  const positioner = useTooltipPositioner({
    anchor,
    positionMethod,
    floatingRootContext,
    trackAnchor,
    mounted,
    side,
    sideOffset,
    align,
    alignOffset,
    collisionBoundary,
    collisionPadding,
    sticky,
    arrowPadding,
    keepMounted,
  });

  const state: TooltipPositioner.State = React.useMemo(
    () => ({
      open,
      side: positioner.side,
      align: positioner.align,
      anchorHidden: positioner.anchorHidden,
    }),
    [open, positioner.side, positioner.align, positioner.anchorHidden],
  );

  const contextValue: TooltipPositionerContext = React.useMemo(
    () => ({
      ...state,
      arrowRef: positioner.arrowRef,
      arrowStyles: positioner.arrowStyles,
      arrowUncentered: positioner.arrowUncentered,
    }),
    [state, positioner.arrowRef, positioner.arrowStyles, positioner.arrowUncentered],
  );

  const renderElement = useRenderElement('div', componentProps, {
    state,
    props: [positioner.props, elementProps],
    ref: [forwardedRef, setPositionerElement],
    customStyleHookMapping: popupStateMapping,
  });

  return (
    <TooltipPositionerContext.Provider value={contextValue}>
      {renderElement()}
    </TooltipPositionerContext.Provider>
  );
});

export namespace TooltipPositioner {
  export interface State {
    /**
     * Whether the tooltip is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    anchorHidden: boolean;
  }

  export interface Props
    extends BaseUIComponentProps<'div', State>,
      useTooltipPositioner.SharedParameters {}
}
