'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useId } from '@base-ui/utils/useId';
import { inertValue } from '@base-ui/utils/inertValue';
import { contains } from '@base-ui/utils/shadowDom';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { createFlushBeforePaint } from '../../internals/createFlushBeforePaint';
import { useNavigationMenuRootContext } from '../root/NavigationMenuRootContext';
import { FocusGuard } from '../../utils/popups/focus/FocusGuard';
import {
  getNextTabbable,
  getPreviousTabbable,
  isOutsideEvent,
} from '../../utils/popups/focus/tabbable';
import { getEmptyRootStore } from '../../utils/popups/floating-root/getEmptyRootStore';
import { useNavigationMenuPositionerContext } from '../positioner/NavigationMenuPositionerContext';

const EMPTY_ROOT_STORE = getEmptyRootStore();
const flushRemovedElementUpdates = createFlushBeforePaint();

function isElementPresent(element: HTMLElement, root: Node | null) {
  return element.isConnected || element.getRootNode() === root;
}

// Suspense detaches refs while keeping DOM nodes. Retain those nodes until DOM removal or
// passive cleanup, and restore registrations when passive effects reconnect.
function useViewportElementRef(
  setElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>,
  enabled = true,
) {
  const registration = React.useRef<{
    element: HTMLElement | null;
    root: Node | null;
    effectsMounted: boolean;
  }>({ element: null, root: null, effectsMounted: enabled }).current;

  const handleRef = useStableCallback((element: HTMLElement | null) => {
    if (element) {
      registration.element = element;
      registration.root = element.getRootNode();
      if (enabled) {
        setElement(element);
      }
      return;
    }

    // Ref detach runs before DOM removal, so inspect the node after the commit.
    queueMicrotask(() => {
      const previousElement = registration.element;
      if (previousElement && !isElementPresent(previousElement, registration.root)) {
        registration.element = null;
        registration.root = null;
        if (registration.effectsMounted) {
          flushRemovedElementUpdates(() => {
            if (registration.effectsMounted) {
              setElement((currentElement) =>
                currentElement === previousElement ? null : currentElement,
              );
            }
          });
        }
      }
    });
  });

  React.useEffect(() => {
    registration.effectsMounted = enabled;
    if (!enabled) {
      return undefined;
    }

    const element = registration.element;
    // React 18 StrictMode replays effects without replaying refs.
    if (element && isElementPresent(element, registration.root)) {
      setElement(element);
    } else {
      registration.element = null;
      registration.root = null;
    }

    return () => {
      registration.effectsMounted = false;
      const previousElement = registration.element;
      setElement((currentElement) => (currentElement === previousElement ? null : currentElement));
    };
  }, [enabled, registration, setElement]);

  return handleRef;
}

function Guards({ children }: { children: React.ReactNode }) {
  const {
    beforeInsideRef,
    beforeOutsideRef,
    afterInsideRef,
    afterOutsideRef,
    positionerElement,
    viewportElement,
    floatingRootStore,
  } = useNavigationMenuRootContext();
  const hasPositioner = Boolean(useNavigationMenuPositionerContext(true));

  const referenceElement = positionerElement || viewportElement;

  if (!floatingRootStore && !hasPositioner) {
    return children;
  }

  return (
    <React.Fragment>
      <FocusGuard
        ref={beforeInsideRef}
        onFocus={(event) => {
          if (referenceElement && isOutsideEvent(event, referenceElement)) {
            getNextTabbable(referenceElement)?.focus();
          } else {
            beforeOutsideRef.current?.focus();
          }
        }}
      />
      {children}
      <FocusGuard
        ref={afterInsideRef}
        onFocus={(event) => {
          if (referenceElement && isOutsideEvent(event, referenceElement)) {
            getPreviousTabbable(referenceElement)?.focus();
          } else {
            afterOutsideRef.current?.focus();
          }
        }}
      />
    </React.Fragment>
  );
}

/**
 * The clipping viewport of the navigation menu's current content.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export const NavigationMenuViewport = React.forwardRef(function NavigationMenuViewport(
  componentProps: NavigationMenuViewport.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, children, id: idProp, ...elementProps } = componentProps;

  const id = useId(idProp);

  const {
    setViewportElement,
    setViewportTargetElement,
    floatingRootStore,
    prevTriggerElementRef,
    viewportInert,
    setViewportInert,
  } = useNavigationMenuRootContext();

  const positioning = useNavigationMenuPositionerContext(true);
  const hasPositioner = Boolean(positioning);

  const updateViewportElement = useStableCallback(
    (element: React.SetStateAction<HTMLElement | null>) => {
      setViewportElement(element);
      if (hasPositioner && element !== null && typeof element !== 'function') {
        // A suspended inline viewport may have left its inner target registered.
        setViewportTargetElement(null);
      }
    },
  );
  const handleViewportElementRef = useViewportElementRef(updateViewportElement);
  const handleViewportTargetElementRef = useViewportElementRef(
    setViewportTargetElement,
    !hasPositioner,
  );

  const domReference = (floatingRootStore || EMPTY_ROOT_STORE).useState('anchorElement');

  useIsoLayoutEffect(() => {
    if (domReference) {
      prevTriggerElementRef.current = domReference;
    }
  }, [domReference, prevTriggerElementRef]);

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, handleViewportElementRef],
    props: [
      {
        id,
        onBlur(event) {
          const relatedTarget = event.relatedTarget as Element | null;
          const currentTarget = event.currentTarget as Element;

          // If focus is leaving the viewport and not going to the trigger, make it inert
          // to prevent a focus loop.
          if (
            relatedTarget &&
            !contains(currentTarget, relatedTarget) &&
            relatedTarget !== domReference
          ) {
            setViewportInert(true);
          }
        },
        ...(!hasPositioner && viewportInert && { inert: inertValue(true) }),
        children: hasPositioner ? (
          children
        ) : (
          <Guards>
            <div ref={handleViewportTargetElementRef}>{children}</div>
          </Guards>
        ),
      },
      elementProps,
    ],
  });

  return hasPositioner ? <Guards>{element}</Guards> : element;
});

export interface NavigationMenuViewportState {}

export interface NavigationMenuViewportProps extends BaseUIComponentProps<
  'div',
  NavigationMenuViewportState
> {}

export namespace NavigationMenuViewport {
  export type State = NavigationMenuViewportState;
  export type Props = NavigationMenuViewportProps;
}
