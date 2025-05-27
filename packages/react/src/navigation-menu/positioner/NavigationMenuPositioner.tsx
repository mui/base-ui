'use client';
import * as React from 'react';
import { getSide } from '@floating-ui/utils';
import { disableFocusInside, enableFocusInside, isOutsideEvent } from '@floating-ui/react/utils';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useNavigationMenuPositioner } from './useNavigationMenuPositioner';
import {
  useNavigationMenuRootContext,
  useNavigationMenuTreeContext,
} from '../root/NavigationMenuRootContext';
import { useNavigationMenuPortalContext } from '../portal/NavigationMenuPortalContext';
import { useAnchorPositioning, type Align, type Side } from '../../utils/useAnchorPositioning';
import { NavigationMenuPositionerContext } from './NavigationMenuPositionerContext';
import { ownerDocument, ownerWindow } from '../../utils/owner';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { popupStateMapping } from '../../utils/popupStateMapping';

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
    className,
    render,
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
    ...elementProps
  } = componentProps;

  const {
    open,
    mounted,
    positionerElement,
    setPositionerElement,
    popupElement,
    floatingRootContext,
    setValue,
  } = useNavigationMenuRootContext();
  const keepMounted = useNavigationMenuPortalContext();
  const nodeId = useNavigationMenuTreeContext();

  const [instant, setInstant] = React.useState(true);

  const positionerRef = React.useRef<HTMLDivElement | null>(null);
  const prevTriggerElementRef = React.useRef<Element | null>(null);

  const runOnceAnimationsFinish = useAnimationsFinished(positionerRef);

  // When the current trigger element changes, enable transitions on the
  // positioner temporarily
  useModernLayoutEffect(() => {
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
      setInstant(false);
      const ac = new AbortController();
      runOnceAnimationsFinish(() => {
        setInstant(true);
      }, ac.signal);
      return () => {
        ac.abort();
      };
    }

    return undefined;
  }, [floatingRootContext?.elements.domReference, runOnceAnimationsFinish]);

  React.useEffect(() => {
    if (!positionerElement) {
      return undefined;
    }

    function handleWindowResize(event: Event) {
      setValue(null, event, undefined);
    }

    const win = ownerWindow(positionerElement);
    win.addEventListener('resize', handleWindowResize);
    return () => {
      win.removeEventListener('resize', handleWindowResize);
    };
  }, [setValue, positionerElement, popupElement]);

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
    positionerElement.addEventListener('focusin', onFocus, true);
    positionerElement.addEventListener('focusout', onFocus, true);
    return () => {
      positionerElement.removeEventListener('focusin', onFocus, true);
      positionerElement.removeEventListener('focusout', onFocus, true);
    };
  }, [positionerElement]);

  const positioning = useAnchorPositioning({
    anchor: anchor ?? floatingRootContext?.elements.domReference ?? prevTriggerElementRef,
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
    floatingRootContext,
    nodeId,
    // Allows the menu to remain anchored without wobbling while its size
    // and position transition simultaneously when side=top or side=left.
    adaptiveOrigin: {
      name: 'adaptiveOrigin',
      async fn(state) {
        const {
          x: rawX,
          y: rawY,
          rects: { floating: floatRect },
          elements: { floating },
          platform,
          strategy,
          placement,
        } = state;

        const win = floating.ownerDocument.defaultView;
        const offsetParent = await platform.getOffsetParent?.(floating);

        let offsetDimensions = { width: 0, height: 0 };

        // For fixed strategy, prefer visualViewport if available
        if (strategy === 'fixed' && win?.visualViewport) {
          offsetDimensions = {
            width: win.visualViewport.width,
            height: win.visualViewport.height,
          };
        } else if (offsetParent === win) {
          const doc = ownerDocument(floating);
          offsetDimensions = {
            width: doc.documentElement.clientWidth,
            height: doc.documentElement.clientHeight,
          };
        } else if (await platform.isElement?.(offsetParent)) {
          offsetDimensions = await platform.getDimensions(offsetParent);
        }

        const currentSide = getSide(placement);
        let x = rawX;
        let y = rawY;

        if (currentSide === 'left') {
          x = offsetDimensions.width - (rawX + floatRect.width);
        }
        if (currentSide === 'top') {
          y = offsetDimensions.height - (rawY + floatRect.height);
        }

        const sideX = currentSide === 'left' ? 'right' : 'left';
        const sideY = currentSide === 'top' ? 'bottom' : 'top';
        return {
          x,
          y,
          data: {
            sideX,
            sideY,
          },
        };
      },
    },
  });

  const defaultProps: React.ComponentProps<'div'> = React.useMemo(() => {
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

  const state: NavigationMenuPositioner.State = React.useMemo(
    () => ({
      open,
      side: positioning.side,
      align: positioning.align,
      anchorHidden: positioning.anchorHidden,
      instant,
    }),
    [open, positioning.side, positioning.align, positioning.anchorHidden, instant],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, setPositionerElement, positionerRef],
    props: [defaultProps, elementProps],
    customStyleHookMapping: popupStateMapping,
  });

  return (
    <NavigationMenuPositionerContext.Provider value={positioning}>
      {element}
    </NavigationMenuPositionerContext.Provider>
  );
});

export namespace NavigationMenuPositioner {
  export interface State {
    /**
     * Whether the navigation menu is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    anchorHidden: boolean;
    /**
     * Whether CSS transitions should be disabled.
     */
    instant: boolean;
  }

  export interface Props
    extends useNavigationMenuPositioner.SharedParameters,
      BaseUIComponentProps<'div', State> {}
}
