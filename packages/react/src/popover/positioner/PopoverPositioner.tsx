'use client';
import * as React from 'react';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { usePopoverPositioner } from './usePopoverPositioner';
import { PopoverPositionerContext } from './PopoverPositionerContext';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Side, Align } from '../../utils/useAnchorPositioning';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { usePopoverPortalContext } from '../portal/PopoverPortalContext';
import { inertValue } from '../../utils/inertValue';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { useRenderElement } from '../../utils/useRenderElement';
import { DEFAULT_COLLISION_AVOIDANCE } from '../../utils/constants';

/**
 * Positions the popover against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export const PopoverPositioner = React.forwardRef(function PopoverPositioner(
  componentProps: PopoverPositioner.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    anchor,
    positionMethod = 'absolute',
    side = 'bottom',
    align = 'center',
    sideOffset = 0,
    alignOffset = 0,
    collisionBoundary = 'clipping-ancestors',
    collisionPadding = 5,
    arrowPadding = 5,
    sticky = false,
    trackAnchor = true,
    collisionAvoidance = DEFAULT_COLLISION_AVOIDANCE,
    ...elementProps
  } = componentProps;

  const {
    floatingRootContext,
    open,
    mounted,
    setPositionerElement,
    modal,
    openReason,
    openMethod,
  } = usePopoverRootContext();
  const keepMounted = usePopoverPortalContext();

  const positioner = usePopoverPositioner({
    anchor,
    floatingRootContext,
    positionMethod,
    mounted,
    open,
    side,
    sideOffset,
    align,
    alignOffset,
    arrowPadding,
    collisionBoundary,
    collisionPadding,
    sticky,
    trackAnchor,
    keepMounted,
    collisionAvoidance,
  });

  const state: PopoverPositioner.State = React.useMemo(
    () => ({
      open,
      side: positioner.side,
      align: positioner.align,
      anchorHidden: positioner.anchorHidden,
    }),
    [open, positioner.side, positioner.align, positioner.anchorHidden],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    props: [positioner.props, elementProps],
    ref: [forwardedRef, setPositionerElement],
    customStyleHookMapping: popupStateMapping,
  });

  return (
    <PopoverPositionerContext.Provider value={positioner}>
      {mounted && modal === true && openReason !== 'trigger-hover' && openMethod !== 'touch' && (
        <InternalBackdrop inert={inertValue(!open)} />
      )}
      {element}
    </PopoverPositionerContext.Provider>
  );
});

export namespace PopoverPositioner {
  export interface State {
    /**
     * Whether the popover is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    anchorHidden: boolean;
  }

  export interface Props
    extends usePopoverPositioner.SharedParameters,
      BaseUIComponentProps<'div', State> {}
}
