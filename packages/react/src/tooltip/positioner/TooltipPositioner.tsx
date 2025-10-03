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
    collisionAvoidance = POPUP_COLLISION_AVOIDANCE,
    ...elementProps
  } = componentProps;

  const { open, setPositionerElement, mounted, floatingRootContext, trackCursorAxis, hoverable } =
    useTooltipRootContext();
  const keepMounted = useTooltipPortalContext();

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
    trackAnchor,
    keepMounted,
    collisionAvoidance,
  });

  const defaultProps: HTMLProps = React.useMemo(() => {
    const hiddenStyles: React.CSSProperties = {};

    if (!open || trackCursorAxis === 'both' || !hoverable) {
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
  }, [open, trackCursorAxis, hoverable, mounted, positioning.positionerStyles]);

  const positioner = React.useMemo(
    () => ({
      props: defaultProps,
      ...positioning,
    }),
    [defaultProps, positioning],
  );

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

  const element = useRenderElement('div', componentProps, {
    state,
    props: [positioner.props, elementProps],
    ref: [forwardedRef, setPositionerElement],
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
}

export interface TooltipPositionerProps
  extends BaseUIComponentProps<'div', TooltipPositioner.State>,
    Omit<useAnchorPositioning.SharedParameters, 'side'> {
  /**
   * Which side of the anchor element to align the popup against.
   * May automatically change to avoid collisions.
   * @default 'top'
   */
  side?: Side;
}

export namespace TooltipPositioner {
  export type State = TooltipPositionerState;
  export type Props = TooltipPositionerProps;
}
