'use client';
import * as React from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import type { PopoverHandle } from './PopoverHandle';
import type { PopoverHandleStore } from './PopoverStore';

export function usePopoverHandleStore<Payload>(
  handle: PopoverHandle<Payload> | undefined,
): PopoverHandleStore<Payload> | undefined {
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
