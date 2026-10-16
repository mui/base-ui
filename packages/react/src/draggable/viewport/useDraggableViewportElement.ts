'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useDraggableContext } from '../DraggableContext';
import { registerViewport, wakeAutoScroll } from '../../utils/drag-and-drop/autoScroller';
import { normalizeOverflowMargin } from '../../utils/drag-and-drop/autoScrollTargets';
import { sameAccept } from '../../utils/drag-and-drop/dragKind';
import type { ViewportParameters } from '../../utils/drag-and-drop/autoScroller';
import { useRegistrationRef } from '../../utils/drag-and-drop/useRegistrationRef';

/**
 * Registers the element the returned `ref` is attached to for auto-scroll.
 * Backs `Draggable.Viewport`. Nested containers need their own registration.
 * The parameters are read every frame, so a re-render never re-registers.
 * @internal
 */
export function useDraggableViewportElement<TSourcePayload = unknown, TDragData = unknown>(
  parameters: UseDraggableViewportElementParameters<TSourcePayload, TDragData>,
): UseDraggableViewportElementReturnValue {
  useDraggableContext();
  // Cast because the public `registerViewport` is typed by the `accept` value, while
  // this hook is typed by the payload, like the component's implementation signature.
  const getParameters = useStableCallback(() => parameters as ViewportParameters<unknown>);

  // Registering during a drag wakes the loop with the latest input. `disabled` is read
  // every frame rather than gating the registration, which would rebuild the engine's
  // registry and its cached depth order each time the prop flips.
  const ref = useRegistrationRef<HTMLElement>((node) => registerViewport(node, getParameters));

  // A parameter change during a drag wakes a loop that parked while the element was
  // disabled or declined to scroll. `accept` is compared by content, since it's often
  // an inline array. The wake on mount does nothing, as the registration already woke the loop.
  const { accept, onDragScroll, disabled, maxSpeed } = parameters;
  const { top, right, bottom, left } = normalizeOverflowMargin(parameters.overflowMargin);
  const previousAcceptRef = React.useRef(accept);
  useIsoLayoutEffect(() => {
    if (sameAccept(previousAcceptRef.current, accept)) {
      return;
    }
    previousAcceptRef.current = accept;
    wakeAutoScroll();
  }, [accept]);
  useIsoLayoutEffect(wakeAutoScroll, [onDragScroll, disabled, maxSpeed, top, right, bottom, left]);

  return { ref };
}

export type UseDraggableViewportElementParameters<
  TSourcePayload = unknown,
  TDragData = unknown,
> = ViewportParameters<TSourcePayload, TDragData>;

export interface UseDraggableViewportElementReturnValue {
  /** Ref callback to attach to the scroll container element. */
  ref: React.RefCallback<HTMLElement>;
}
