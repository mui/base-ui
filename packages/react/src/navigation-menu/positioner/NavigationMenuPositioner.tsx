'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { ownerWindow } from '@base-ui/utils/owner';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { useAnimationsFinished } from '../../internals/useAnimationsFinished';
import {
  disableFocusInside,
  enableFocusInside,
  isOutsideEvent,
} from '../../utils/popups/focus/tabbable';
import type { BaseUIComponentProps } from '../../internals/types';
import {
  useNavigationMenuRootContext,
  useNavigationMenuTreeContext,
} from '../root/NavigationMenuRootContext';
import { useNavigationMenuPortalContext } from '../portal/NavigationMenuPortalContext';
import type {
  Align,
  Side,
  UseAnchorPositioningSharedParameters,
} from '../../internals/useAnchorPositioning';
import { useAnchorPositioning } from '../../internals/useAnchorPositioning';
import { useFloatingRootStore } from '../../utils/popups/floating-root/useFloatingRootStore';
import { NavigationMenuPositionerContext } from './NavigationMenuPositionerContext';
import { DROPDOWN_COLLISION_AVOIDANCE, POPUP_COLLISION_AVOIDANCE } from '../../internals/constants';
import { adaptiveOrigin } from '../../utils/popups/positioning/adaptiveOriginMiddleware';
import { usePositioner } from '../../utils/popups/positioning/usePositioner';

/**
 * Positions the navigation menu against the currently active trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export const NavigationMenuPositioner = React.forwardRef(function NavigationMenuPositioner(
  componentProps: NavigationMenuPositioner.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    open,
    mounted,
    positionerElement,
    setPositionerElement,
    floatingRootStore,
    nested,
    transitionStatus,
    prevTriggerElementRef,
  } = useNavigationMenuRootContext();

  const {
    className,
    render,
    anchor,
    positionMethod,
    side = 'bottom',
    align = 'center',
    sideOffset,
    alignOffset,
    collisionBoundary,
    collisionPadding,
    collisionAvoidance = nested ? POPUP_COLLISION_AVOIDANCE : DROPDOWN_COLLISION_AVOIDANCE,
    arrowPadding,
    sticky,
    disableAnchorTracking,
    style,
    ...elementProps
  } = componentProps;

  const keepMounted = useNavigationMenuPortalContext();
  const nodeId = useNavigationMenuTreeContext();

  const [instant, setInstant] = React.useState(true);
  const previousTriggerRef = React.useRef<Element | null>(null);
  // Closing alone must not cancel an in-flight trigger-switch transition.
  const openRef = useValueAsRef(open);
  const runOnceAnimationsFinish = useAnimationsFinished(positionerElement, false, false, true);

  // https://codesandbox.io/s/tabbable-portal-f4tng?file=/src/TabbablePortal.tsx
  React.useEffect(() => {
    if (!positionerElement) {
      return undefined;
    }

    // Make sure elements inside the portal element are tabbable only when the
    // portal has already been focused, either by tabbing into a focus trap
    // element outside or using the mouse.
    function onFocus(event: FocusEvent) {
      if (positionerElement && isOutsideEvent(event)) {
        const focusing = event.type === 'focusin';
        const manageFocus = focusing ? enableFocusInside : disableFocusInside;
        manageFocus(positionerElement);
      }
    }

    // Listen to the event on the capture phase so they run before the focus
    // trap elements onFocus prop is called.
    return mergeCleanups(
      addEventListener(positionerElement, 'focusin', onFocus, true),
      addEventListener(positionerElement, 'focusout', onFocus, true),
    );
  }, [positionerElement]);

  // The active trigger supplies the root store after the positioner has already rendered.
  const fallbackRootStore = useFloatingRootStore({
    open: keepMounted ? mounted : undefined,
    // The active trigger store is released on close, but positioning must keep
    // following its anchor until the popup finishes exiting.
    elements: { anchor: prevTriggerElementRef.current ?? null, positionerElement },
  });
  const interactionStore = floatingRootStore || fallbackRootStore;

  const domReference = interactionStore.useState('anchorElement');

  const positioning = useAnchorPositioning({
    anchor: anchor ?? domReference,
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
    disableAnchorTracking,
    keepMounted,
    interactionStore,
    collisionAvoidance,
    shift: { rootBoundary: 'layoutViewport' },
    nodeId,
    // Allows the menu to remain anchored without wobbling while its size
    // and position transition simultaneously when side=top or side=left.
    adaptiveOrigin,
  });

  useIsoLayoutEffect(() => {
    const previousTrigger = previousTriggerRef.current;
    previousTriggerRef.current = mounted ? domReference : null;

    if (!openRef.current || !previousTrigger || !domReference) {
      setInstant(true);
      return undefined;
    }

    if (previousTrigger === domReference) {
      return undefined;
    }

    // Only a hand-off between triggers should animate the position. Ordinary
    // scroll and layout updates stay instant, including during the exit.
    setInstant(false);
    const controller = new AbortController();
    runOnceAnimationsFinish(() => setInstant(true), controller.signal);
    return () => controller.abort();
  }, [domReference, mounted, openRef, runOnceAnimationsFinish]);

  React.useEffect(() => {
    if (!mounted || !positionerElement) {
      return undefined;
    }

    function handleResize() {
      ReactDOM.flushSync(() => setInstant(true));
    }

    return addEventListener(ownerWindow(positionerElement), 'resize', handleResize);
  }, [mounted, positionerElement]);

  const state: NavigationMenuPositionerState = {
    open,
    side: positioning.side,
    align: positioning.align,
    anchorHidden: positioning.anchorHidden,
    instant,
  };

  const element = usePositioner(componentProps, state, {
    styles: positioning.positionerStyles,
    transitionStatus,
    props: elementProps,
    refs: [forwardedRef, setPositionerElement],
    hidden: !mounted,
    inert: !open,
  });

  return (
    <NavigationMenuPositionerContext.Provider value={positioning}>
      {element}
    </NavigationMenuPositionerContext.Provider>
  );
});

export interface NavigationMenuPositionerState {
  /**
   * Whether the navigation menu is currently open.
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
  instant: boolean;
}

export interface NavigationMenuPositionerProps
  extends
    UseAnchorPositioningSharedParameters,
    BaseUIComponentProps<'div', NavigationMenuPositionerState> {}

export namespace NavigationMenuPositioner {
  export type State = NavigationMenuPositionerState;
  export type Props = NavigationMenuPositionerProps;
}
