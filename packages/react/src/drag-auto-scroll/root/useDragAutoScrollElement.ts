'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
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
 * The parameters are read through a ref on every frame, so a re-render never
 * re-registers and the freshest callbacks always apply.
 * @internal
 */
export function useDragAutoScrollElement<TSourceData = unknown>(
  parameters: UseDragAutoScrollElementParameters<TSourceData>,
): UseDragAutoScrollElementReturnValue {
  const paramsRef = useValueAsRef(parameters);

  // Registering mid-drag needs nothing from this layer: the loop is already
  // armed and running on a live input (the first draggable armed it), so the
  // element just joins the candidate set on the frame the registration wakes.
  // The public `registerAutoScroller` is keyed on the `accept` value; this
  // internal layer is keyed on the payload it promises (like the component's
  // implementation signature), so the parameters are erased to `unknown` here.
  // `disabled` rides along in the parameters (the engine reads it every frame)
  // rather than gating the registration, which would churn the engine's registry
  // — and its cached depth order — on every flip of the prop.
  const ref = useRegistrationRef<HTMLElement>((node) =>
    registerAutoScroller(node, () => paramsRef.current as RegisterAutoScrollerParameters<unknown>),
  );

  useIsoLayoutEffect(() => {
    // Parameters and the element's class/style can both change computed scroll
    // behavior. Re-evaluate after every commit so a stationary pointer sees the
    // current render without waiting for another input event.
    refreshAutoScroll();
  });

  return { ref };
}

export type UseDragAutoScrollElementParameters<TSourceData = unknown> =
  RegisterAutoScrollerParameters<TSourceData>;

export interface UseDragAutoScrollElementReturnValue {
  /** Ref callback to attach to the scroll container element. */
  ref: React.RefCallback<HTMLElement>;
}
