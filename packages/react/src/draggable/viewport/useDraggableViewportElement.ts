'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useDraggableContext } from '../DraggableContext';
import { registerAutoScroller } from '../../utils/drag-and-drop/registrations';
import { wakeAutoScroll } from '../../utils/drag-and-drop/autoScroller';
import { sameAccept } from '../../utils/drag-and-drop/dragKind';
import type { RegisterAutoScrollerParameters } from '../../utils/drag-and-drop/autoScroller';
import { useRegistrationRef } from '../../utils/drag-and-drop/useRegistrationRef';

/**
 * Registers only the element the returned `ref` is attached to for auto-scroll.
 * Backs `Draggable.Viewport`. Nested containers need their own registration.
 *
 * The parameters are read through a stable getter on every frame, so a re-render never
 * re-registers and the freshest callbacks always apply.
 * @internal
 */
export function useDraggableViewportElement<TSourcePayload = unknown>(
  parameters: UseDraggableViewportElementParameters<TSourcePayload>,
): UseDraggableViewportElementReturnValue {
  useDraggableContext();
  const getParameters = useStableCallback(
    () => parameters as RegisterAutoScrollerParameters<unknown>,
  );

  // Registering mid-drag arms and wakes the loop with the latest live input.
  // The public `registerAutoScroller` is keyed on the `accept` value; this
  // internal layer is keyed on the payload it promises (like the component's
  // implementation signature), so the parameters are erased to `unknown` here.
  // `disabled` rides along in the parameters (the engine reads it every frame)
  // rather than gating the registration, which would churn the engine's registry
  // — and its cached depth order — on every flip of the prop.
  const ref = useRegistrationRef<HTMLElement>((node) => registerAutoScroller(node, getParameters));

  // A live parameter change must wake a loop that parked while the element was
  // disabled or declined scrolling. Compared against the previous values — by
  // content for `accept`, commonly an inline array — rather than trusted as
  // effect deps, so a render that changes nothing wakes nothing. A wake is all a
  // change needs: the loop reads the parameters through `getParameters` every
  // frame, so no shared geometry/style cache has to be dropped for it to apply.
  const { accept, onDragScroll, disabled, maxSpeed } = parameters;
  const previousRef = React.useRef({
    accept,
    onDragScroll,
    disabled,
    maxSpeed,
  });
  useIsoLayoutEffect(() => {
    const previous = previousRef.current;
    if (
      sameAccept(previous.accept, accept) &&
      previous.onDragScroll === onDragScroll &&
      previous.disabled === disabled &&
      previous.maxSpeed === maxSpeed
    ) {
      return;
    }
    previousRef.current = { accept, onDragScroll, disabled, maxSpeed };
    wakeAutoScroll();
  }, [accept, onDragScroll, disabled, maxSpeed]);

  return { ref };
}

export type UseDraggableViewportElementParameters<TSourcePayload = unknown> =
  RegisterAutoScrollerParameters<TSourcePayload>;

export interface UseDraggableViewportElementReturnValue {
  /** Ref callback to attach to the scroll container element. */
  ref: React.RefCallback<HTMLElement>;
}
