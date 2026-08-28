'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { registerAutoScroller } from '../../utils/drag-and-drop/registrations';
import { wakeAutoScroll } from '../../utils/drag-and-drop/autoScroller';
import { sameAccept } from '../../utils/drag-and-drop/dragKind';
import type { RegisterAutoScrollerParameters } from '../../types/dragRegistration';
import { useRegistrationRef } from '../../utils/drag-and-drop/useRegistrationRef';

/**
 * Configures the element the returned `ref` is attached to as an auto-scroll
 * container, and enables auto-scroll when used without a provider. Backs
 * `DragAutoScroll.Root`.
 *
 * Once enabled, the engine also infers nested scroll containers from the DOM.
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
  const { accept, allowedAxis, applyScroll, canScroll, disabled, maxSpeed } = parameters;
  const previousRef = React.useRef({
    accept,
    allowedAxis,
    applyScroll,
    canScroll,
    disabled,
    maxSpeed,
  });
  useIsoLayoutEffect(() => {
    const previous = previousRef.current;
    if (
      sameAccept(previous.accept, accept) &&
      previous.allowedAxis === allowedAxis &&
      previous.applyScroll === applyScroll &&
      previous.canScroll === canScroll &&
      previous.disabled === disabled &&
      previous.maxSpeed === maxSpeed
    ) {
      return;
    }
    previousRef.current = { accept, allowedAxis, applyScroll, canScroll, disabled, maxSpeed };
    wakeAutoScroll();
  }, [accept, allowedAxis, applyScroll, canScroll, disabled, maxSpeed]);

  return { ref };
}

export type UseDragAutoScrollElementParameters<TSourceData = unknown> =
  RegisterAutoScrollerParameters<TSourceData>;

export interface UseDragAutoScrollElementReturnValue {
  /** Ref callback to attach to the scroll container element. */
  ref: React.RefCallback<HTMLElement>;
}
