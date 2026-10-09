'use client';
import * as React from 'react';
import { inertValue } from '@base-ui/utils/inertValue';
import { FloatingNode, useFloatingNodeId } from '../../utils/popups/tree/FloatingTree';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { PopoverPositionerContext } from './PopoverPositionerContext';
import type {
  Side,
  Align,
  UseAnchorPositioningSharedParameters,
} from '../../internals/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../internals/types';
import { usePopoverPortalContext } from '../portal/PopoverPortalContext';
import { InternalBackdrop } from '../../utils/popups/InternalBackdrop';
import { REASONS } from '../../internals/reasons';
import { POPUP_COLLISION_AVOIDANCE } from '../../internals/constants';
import { useTriggerSwitchTransition } from '../../internals/useTriggerSwitchTransition';
import { usePopupPositioner } from '../../utils/popups/popupPositioner';
import { useAnchoredPopupScrollLock } from '../../utils/popups/useAnchoredPopupScrollLock';

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
  const store = usePopoverRootContext();
  const keepMounted = usePopoverPortalContext();
  const nodeId = useFloatingNodeId();

  const { element, positioning } = usePopupPositioner(store, componentProps, {
    forwardedRef,
    keepMounted,
    defaults: { collisionAvoidance: POPUP_COLLISION_AVOIDANCE },
    positioning: { nodeId },
  });

  const mounted = store.useState('mounted');
  const open = store.useState('open');
  const openReason = store.useState('openChangeReason');
  const triggerElement = store.useState('activeTriggerElement');
  const modal = store.useState('modal');
  const openMethod = store.useState('openMethod');
  const positionerElement = store.useState('positionerElement');
  const domReference = store.useState('domReferenceElement');

  useTriggerSwitchTransition({
    store,
    domReference,
    positionerElement,
    open,
  });

  const trueModalNonHover = modal === true && openReason !== REASONS.triggerHover;

  useAnchoredPopupScrollLock(
    open && trueModalNonHover,
    openMethod === 'touch',
    positionerElement,
    triggerElement,
  );

  return (
    <PopoverPositionerContext.Provider value={positioning}>
      {mounted && trueModalNonHover && (
        <InternalBackdrop inert={inertValue(!open)} cutout={triggerElement} />
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
  /**
   * The side of the anchor the component is placed on.
   */
  side: Side;
  /**
   * The alignment of the component relative to the anchor.
   */
  align: Align;
  /**
   * Whether the anchor element is hidden.
   */
  anchorHidden: boolean;
  /**
   * Whether CSS transitions should be disabled.
   */
  instant: string | undefined;
}

export interface PopoverPositionerProps
  extends
    UseAnchorPositioningSharedParameters,
    BaseUIComponentProps<'div', PopoverPositionerState> {}

export namespace PopoverPositioner {
  export type State = PopoverPositionerState;
  export type Props = PopoverPositionerProps;
}
