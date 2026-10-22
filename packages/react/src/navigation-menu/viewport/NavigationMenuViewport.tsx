'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useId } from '@base-ui/utils/useId';
import { inertValue } from '@base-ui/utils/inertValue';
import { contains } from '@base-ui/utils/shadowDom';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
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

function keepIfConnected(element: HTMLElement | null) {
  return element?.isConnected ? element : null;
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

  // A Suspense boundary above the root detaches refs while showing its fallback. Clearing the
  // elements then unmounts the suspended content, which reveals the tree again in a loop.
  const handleViewportElementRef = useStableCallback((element: HTMLDivElement | null) => {
    if (element) {
      setViewportElement(element);
    }
  });
  const handleViewportTargetElementRef = useStableCallback((element: HTMLDivElement | null) => {
    if (element) {
      setViewportTargetElement(element);
    }
  });

  // Clear them on unmount instead. Hidden trees and React 18 StrictMode's simulated unmount keep
  // the elements in the DOM, so only drop the ones that left it.
  React.useEffect(
    () => () => {
      setViewportElement(keepIfConnected);
      setViewportTargetElement(keepIfConnected);
    },
    [setViewportElement, setViewportTargetElement],
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
