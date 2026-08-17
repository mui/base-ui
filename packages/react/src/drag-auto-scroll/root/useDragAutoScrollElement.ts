'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { ownerWindow } from '@base-ui/utils/owner';
import { registerAutoScroller } from '../../utils/drag-and-drop/registrations';
import { refreshAutoScroll } from '../../utils/drag-and-drop/autoScroller';
import type { RegisterAutoScrollerParameters } from '../../types/dragRegistration';
import { useRegistrationRef } from '../../utils/drag-and-drop/useRegistrationRef';

/**
 * Configures the element the returned `ref` is attached to as an auto-scroll
 * container, which scrolls while a drag nears its edges. Backs
 * `DragAutoScroll.Root`.
 *
 * The engine also infers scroll containers from the DOM, so this is what
 * *configures* one rather than what makes it scroll.
 *
 * The parameters are read through a stable getter on every frame, so a re-render never
 * re-registers and the freshest callbacks always apply.
 * @internal
 */
export function useDragAutoScrollElement<TSourceData = unknown>(
  parameters: UseDragAutoScrollElementParameters<TSourceData>,
): UseDragAutoScrollElementReturnValue {
  const getParameters = useStableCallback(
    () => parameters as RegisterAutoScrollerParameters<unknown>,
  );
  const observerRef = React.useRef<MutationObserver | null>(null);

  // Registering mid-drag needs nothing from this layer: the loop is already
  // armed and running on a live input (the first draggable armed it), so the
  // element just joins the candidate set on the frame the registration wakes.
  // The public `registerAutoScroller` is keyed on the `accept` value; this
  // internal layer is keyed on the payload it promises (like the component's
  // implementation signature), so the parameters are erased to `unknown` here.
  // `disabled` rides along in the parameters (the engine reads it every frame)
  // rather than gating the registration, which would churn the engine's registry
  // — and its cached depth order — on every flip of the prop.
  const ref = useRegistrationRef<HTMLElement>((node) => registerAutoScroller(node, getParameters));
  const mergedRef = useRefWithInit(() => (node: HTMLElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    ref(node);
    if (node) {
      const observer = new (ownerWindow(node).MutationObserver)(refreshAutoScroll);
      observer.observe(node, {
        attributes: true,
        attributeFilter: ['class', 'style'],
        childList: true,
        subtree: true,
      });
      observerRef.current = observer;
    }
  }).current;

  useIsoLayoutEffect(() => {
    // A live parameter change must wake a loop that parked while the element was
    // disabled or declined scrolling. Stable parameters no longer discard the
    // shared geometry/style caches on every unrelated parent render.
    refreshAutoScroll();
  }, [
    parameters.accept,
    parameters.allowedAxis,
    parameters.applyScroll,
    parameters.canScroll,
    parameters.disabled,
    parameters.maxSpeed,
  ]);

  return { ref: mergedRef };
}

export type UseDragAutoScrollElementParameters<TSourceData = unknown> =
  RegisterAutoScrollerParameters<TSourceData>;

export interface UseDragAutoScrollElementReturnValue {
  /** Ref callback to attach to the scroll container element. */
  ref: React.RefCallback<HTMLElement>;
}
