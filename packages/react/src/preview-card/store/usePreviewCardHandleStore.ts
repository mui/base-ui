'use client';
import * as React from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import type { PreviewCardHandle } from './PreviewCardHandle';
import type { PreviewCardHandleStore } from './PreviewCardStore';

export function usePreviewCardHandleStore<Payload>(
  handle: PreviewCardHandle<Payload> | undefined,
): PreviewCardHandleStore<Payload> | undefined {
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
