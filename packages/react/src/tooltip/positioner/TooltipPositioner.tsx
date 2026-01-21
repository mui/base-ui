'use client';
import * as React from 'react';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import { TooltipPositionerContext } from './TooltipPositionerContext';
import { useAnchorPositioning, type Side, type Align } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { useTooltipPortalContext } from '../portal/TooltipPortalContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { POPUP_COLLISION_AVOIDANCE } from '../../utils/constants';
import { adaptiveOrigin } from '../../utils/adaptiveOriginMiddleware';
import { getDisabledMountTransitionStyles } from '../../utils/getDisabledMountTransitionStyles';

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
    disableAnchorTracking = false,
    collisionAvoidance = POPUP_COLLISION_AVOIDANCE,
    ...elementProps
  } = componentProps;

  const store = useTooltipRootContext();
  const keepMounted = useTooltipPortalContext();

  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const trackCursorAxis = store.useState('trackCursorAxis');
  const disableHoverablePopup = store.useState('disableHoverablePopup');
  const floatingRootContext = store.useState('floatingRootContext');
  const instantType = store.useState('instantType');
  const transitionStatus = store.useState('transitionStatus');
  const hasViewport = store.useState('hasViewport');

  const positioning = useAnchorPositioning({
    anchor,
    positionMethod,
    floatingRootContext,
    mounted,
    side,
    sideOffset,
    align,
    alignOffset,
    collisionBoundary,
    collisionPadding,
    sticky,
    arrowPadding,
    disableAnchorTracking,
    keepMounted,
    collisionAvoidance,
    adaptiveOrigin: hasViewport ? adaptiveOrigin : undefined,
  });

  const defaultProps: HTMLProps = React.useMemo(() => {
    const hiddenStyles: React.CSSProperties = {};

    if (!open || trackCursorAxis === 'both' || disableHoverablePopup) {
      hiddenStyles.pointerEvents = 'none';
    }

    return {
      role: 'presentation',
      hidden: !mounted,
      style: {
        ...positioning.positionerStyles,
        ...hiddenStyles,
      },
    };
  }, [open, trackCursorAxis, disableHoverablePopup, mounted, positioning.positionerStyles]);

  const state: TooltipPositioner.State = React.useMemo(
    () => ({
      open,
      side: positioning.side,
      align: positioning.align,
      anchorHidden: positioning.anchorHidden,
      instant: trackCursorAxis !== 'none' ? 'tracking-cursor' : instantType,
    }),
    [
      open,
      positioning.side,
      positioning.align,
      positioning.anchorHidden,
      trackCursorAxis,
      instantType,
    ],
  );

  const contextValue: TooltipPositionerContext = React.useMemo(
    () => ({
      ...state,
      arrowRef: positioning.arrowRef,
      arrowStyles: positioning.arrowStyles,
      arrowUncentered: positioning.arrowUncentered,
    }),
    [state, positioning.arrowRef, positioning.arrowStyles, positioning.arrowUncentered],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    props: [defaultProps, getDisabledMountTransitionStyles(transitionStatus), elementProps],
    ref: [forwardedRef, store.useStateSetter('positionerElement')],
    stateAttributesMapping: popupStateMapping,
  });

  return (
    <TooltipPositionerContext.Provider value={contextValue}>
      {element}
    </TooltipPositionerContext.Provider>
  );
});

export interface TooltipPositionerState {
  /**
   * Whether the tooltip is currently open.
   */
  open: boolean;
  side: Side;
  align: Align;
  anchorHidden: boolean;
  /**
   * Whether CSS transitions should be disabled.
   */
  instant: string | undefined;
}

export interface TooltipPositionerProps
  extends
    BaseUIComponentProps<'div', TooltipPositioner.State>,
    Omit<useAnchorPositioning.SharedParameters, 'side'> {
  /**
   * Which side of the anchor element to align the popup against.
   * May automatically change to avoid collisions.
   * @default 'top'
   */
  side?: Side | undefined;
}

export namespace TooltipPositioner {
  export type State = TooltipPositionerState;
  export type Props = TooltipPositionerProps;
}
