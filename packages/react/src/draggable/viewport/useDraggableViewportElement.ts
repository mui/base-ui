'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useDraggableContext } from '../DraggableContext';
import {
  normalizeOverflowMargin,
  registerViewport,
  wakeAutoScroll,
} from '../../utils/drag-and-drop/autoScroller';
import { sameAccept } from '../../utils/drag-and-drop/dragKind';
import type { ViewportParameters } from '../../utils/drag-and-drop/autoScroller';
import { useRegistrationRef } from '../../utils/drag-and-drop/useRegistrationRef';

/**
 * Registers the element the returned `ref` is attached to for auto-scroll.
 * Backs `Draggable.Viewport`. Nested containers need their own registration.
 *
 * The engine reads the parameters through a stable getter every frame, so a
 * re-render never re-registers and the latest callbacks always apply.
 * @internal
 */
export function useDraggableViewportElement<TSourcePayload = unknown, TDragData = unknown>(
  parameters: UseDraggableViewportElementParameters<TSourcePayload, TDragData>,
): UseDraggableViewportElementReturnValue {
  useDraggableContext();
  // The public `registerViewport` is typed by the `accept` value, while this
  // internal hook is typed by the payload it promises, like the component's
  // implementation signature. So the parameters are cast to `unknown` here.
  const getParameters = useStableCallback(() => parameters as ViewportParameters<unknown>);

  // Registering during a drag starts and wakes the loop with the latest input.
  // `disabled` is read from the parameters every frame instead of gating the
  // registration. Gating would rebuild the engine's registry, and its cached
  // depth order, every time the prop flips.
  const ref = useRegistrationRef<HTMLElement>((node) => registerViewport(node, getParameters));

  // A parameter change during a drag wakes a loop that parked while the element
  // was disabled or declined to scroll. `accept` is often an inline array, so it
  // is compared by content and a render that changes nothing wakes nothing. No
  // cache needs clearing, because the loop reads the parameters through
  // `getParameters` every frame. The wake on mount does nothing, since the
  // registration already woke the loop.
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
