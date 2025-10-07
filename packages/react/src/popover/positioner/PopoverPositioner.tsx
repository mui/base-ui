'use client';
import * as React from 'react';
import { inertValue } from '@base-ui-components/utils/inertValue';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
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
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { adaptiveOrigin } from '../../utils/adaptiveOriginMiddleware';

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

  const { store } = usePopoverRootContext();
  const keepMounted = usePopoverPortalContext();
  const nodeId = useFloatingNodeId();

  const floatingRootContext = store.useState('floatingRootContext');
  const mounted = store.useState('mounted');
  const open = store.useState('open');
  const openMethod = store.useState('openMethod');
  const openReason = store.useState('openReason');
  const triggerElement = store.useState('activeTriggerElement');
  const modal = store.useState('modal');
  const positionerElement = store.useState('positionerElement');
  const instantType = store.useState('instantType');

  const prevTriggerElementRef = React.useRef<Element | null>(null);

  const runOnceAnimationsFinish = useAnimationsFinished(positionerElement, false, false);

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
    adaptiveOrigin,
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

  // When the current trigger element changes, enable transitions on the
  // positioner temporarily
  useIsoLayoutEffect(() => {
    const currentTriggerElement = floatingRootContext?.elements.domReference;
    const prevTriggerElement = prevTriggerElementRef.current;

    if (currentTriggerElement) {
      prevTriggerElementRef.current = currentTriggerElement;
    }

    if (
      prevTriggerElement &&
      currentTriggerElement &&
      currentTriggerElement !== prevTriggerElement
    ) {
      store.set('instantType', undefined);
      const ac = new AbortController();
      runOnceAnimationsFinish(() => {
        store.set('instantType', 'trigger-change');
      }, ac.signal);

      return () => {
        ac.abort();
      };
    }

    return undefined;
  }, [floatingRootContext?.elements.domReference, runOnceAnimationsFinish, store]);

  const state: PopoverPositioner.State = React.useMemo(
    () => ({
      open,
      side: positioner.side,
      align: positioner.align,
      anchorHidden: positioner.anchorHidden,
      instant: instantType,
    }),
    [open, positioner.side, positioner.align, positioner.anchorHidden, instantType],
  );

  const setPositionerElement = React.useCallback(
    (element: HTMLElement | null) => {
      store.set('positionerElement', element);
    },
    [store],
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
          ref={store.context.internalBackdropRef}
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
  /**
   * Whether CSS transitions should be disabled.
   */
  instant: string | undefined;
}

export interface PopoverPositionerProps
  extends useAnchorPositioning.SharedParameters,
    BaseUIComponentProps<'div', PopoverPositioner.State> {}

export namespace PopoverPositioner {
  export type State = PopoverPositionerState;
  export type Props = PopoverPositionerProps;
}
