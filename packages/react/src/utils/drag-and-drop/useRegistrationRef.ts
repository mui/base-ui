'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { DragCleanupFn } from './types';

/**
 * Returns a stable ref callback that registers the attached element, and
 * unregisters it when the node detaches or is replaced. `register` is read at
 * call time, so it can close over the latest props without recreating the callback.
 *
 * The callback returns `void`, not a `React.RefCallback` cleanup. It keeps its
 * own cleanup in `cleanupRef`, so calling it directly to re-register loses
 * nothing. The narrower type is still assignable wherever a ref callback is expected.
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
      // before refs attach. An abandoned or suspended render therefore can't leak
      // its registration parameters, as it could with a ref written during render.
      cleanupRef.current = registerStable(element);
    }
  }).current;
}
