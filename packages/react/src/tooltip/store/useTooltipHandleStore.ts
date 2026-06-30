'use client';
import * as React from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import type { TooltipHandle } from './TooltipHandle';
import type { TooltipHandleStore } from './TooltipStore';

export function useTooltipHandleStore<Payload>(
  handle: TooltipHandle<Payload> | undefined,
): TooltipHandleStore<Payload> | undefined {
  const subscribe = React.useCallback(
    (listener: () => void) => {
      if (handle === undefined) {
        return () => {};
      }

      return handle.subscribeStore(listener);
    },
    [handle],
  );

  const getSnapshot = React.useCallback(() => {
    return handle === undefined ? undefined : handle.store;
  }, [handle]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
