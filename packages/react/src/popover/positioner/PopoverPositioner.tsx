'use client';
import * as React from 'react';
import { inertValue } from '@base-ui-components/utils/inertValue';
import { FloatingNode, useFloatingNodeId } from '../../floating-ui-react';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { PopoverPositionerContext } from './PopoverPositionerContext';
import { useAnchorPositioning, type Side, type Align } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { usePopoverPortalContext } from '../portal/PopoverPortalContext';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { useRenderElement } from '../../utils/useRenderElement';
import { POPUP_COLLISION_AVOIDANCE } from '../../utils/constants';

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
    collisionAvoidance = POPUP_COLLISION_AVOIDANCE,
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
    triggerElement,
    internalBackdropRef,
  } = usePopoverRootContext();
  const keepMounted = usePopoverPortalContext();
  const nodeId = useFloatingNodeId();

  const positioning = useAnchorPositioning({
    anchor,
    floatingRootContext,
    positionMethod,
    mounted,
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
    nodeId,
    collisionAvoidance,
  });

  const defaultProps: HTMLProps = React.useMemo(() => {
    const hiddenStyles: React.CSSProperties = {};

    if (!open) {
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
  }, [open, mounted, positioning.positionerStyles]);

  const positioner = React.useMemo(
    () => ({
      props: defaultProps,
      ...positioning,
    }),
    [defaultProps, positioning],
  );

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
    stateAttributesMapping: popupStateMapping,
  });

  return (
    <PopoverPositionerContext.Provider value={positioner}>
      {mounted && modal === true && openReason !== 'trigger-hover' && openMethod !== 'touch' && (
        <InternalBackdrop
          ref={internalBackdropRef}
          inert={inertValue(!open)}
          cutout={triggerElement}
        />
      )}
      <FloatingNode id={nodeId}>{element}</FloatingNode>
    </PopoverPositionerContext.Provider>
  );
});

export interface PopoverPositionerState {
  /**
   * Whether the popover is currently open.
   */
  open: boolean;
  side: Side;
  align: Align;
  anchorHidden: boolean;
}

export interface PopoverPositionerProps
  extends useAnchorPositioning.SharedParameters,
    BaseUIComponentProps<'div', PopoverPositioner.State> {}

export namespace PopoverPositioner {
  export type State = PopoverPositionerState;
  export type Props = PopoverPositionerProps;
}
