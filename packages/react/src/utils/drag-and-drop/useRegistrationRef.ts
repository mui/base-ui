'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { DragCleanupFn } from '../../types/drag';

/** A commit-safe getter used by long-lived drag registrations. */
export type LatestGetter<T> = () => T;

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
  const registerStable = useStableCallback(register);
  const cleanupRef = React.useRef<DragCleanupFn | null>(null);

  return useRefWithInit(() => (element: TElement | null) => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (element) {
      // `useStableCallback` publishes the current closure during the commit,
      // before refs attach. Unlike a ref written during render, an abandoned or
      // suspended render can therefore never leak its registration parameters.
      cleanupRef.current = registerStable(element);
    }
  }).current;
}
