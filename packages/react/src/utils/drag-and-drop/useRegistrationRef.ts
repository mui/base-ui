'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import type { DragCleanupFn } from '../../types/drag';

/**
 * The staged-then-committed ref shape `useValueAsRef` returns. `next` holds the
 * current render's value before the layout effect commits `.current`.
 * Shared by the engine and the collection plugin.
 */
export interface LatestRef<T> {
  readonly current: T;
  readonly next: T;
}

/**
 * A stable ref callback that registers the attached element and tears the
 * registration down when the node detaches or is swapped. `register` is read
 * live, so it may close over the latest props without recreating the callback.
 *
 * Returns `void` rather than a `React.RefCallback`, which may return a cleanup:
 * teardown is owned internally (`cleanupRef`), so calling this directly to
 * re-register discards nothing. The narrower type stays assignable wherever a
 * ref callback is expected.
 */
export function useRegistrationRef<TElement extends Element>(
  register: (element: TElement) => DragCleanupFn,
): (element: TElement | null) => void {
  const registerRef = useValueAsRef(register);
  const cleanupRef = React.useRef<DragCleanupFn | null>(null);

  return useRefWithInit(() => (element: TElement | null) => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (element) {
      // `.next`, not `.current` — the canonical reason, referenced from the other
      // `useValueAsRef` readers in the drag layer:
      //
      // Ref callbacks fire earlier in a commit than the layout effect that
      // commits `.current`, so a same-commit node swap (or a mid-drag
      // registration, which the engine reads synchronously) would otherwise run
      // the *previous* render's closure. `next` is assigned unconditionally on
      // every render and typed `T`, so it is always the current render's value
      // and never needs a `?? current` fallback.
      cleanupRef.current = registerRef.next(element);
    }
  }).current;
}
