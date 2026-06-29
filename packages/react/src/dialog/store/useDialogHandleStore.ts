'use client';
import * as React from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import type { DialogHandle } from './DialogHandle';
import type { DialogHandleStore } from './DialogStore';

export function useDialogHandleStore<Payload>(
  handle: DialogHandle<Payload> | undefined,
): DialogHandleStore<Payload> | undefined {
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
