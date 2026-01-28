'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import {
  DrawerProviderContext,
  type DrawerFrontmostHeightStore,
  type DrawerSwipeProgressStore,
} from './DrawerProviderContext';

/**
 * Provides a shared context for coordinating global Drawer UI,
 * such as indent/background effects based on whether any Drawer is open.
 */
export function DrawerProvider(props: DrawerProvider.Props) {
  const { children } = props;

  const [openById, setOpenById] = React.useState(() => new Map<string, boolean>());
  const [swipeProgressStore] = React.useState(createSwipeProgressStore);
  const [frontmostHeightStore] = React.useState(createFrontmostHeightStore);

  const setDrawerOpen = useStableCallback((drawerId: string, open: boolean) => {
    setOpenById((prev) => {
      const prevOpen = prev.get(drawerId);
      if (prevOpen === open) {
        return prev;
      }
      const next = new Map(prev);
      next.set(drawerId, open);
      return next;
    });
  });

  const removeDrawer = useStableCallback((drawerId: string) => {
    setOpenById((prev) => {
      if (!prev.has(drawerId)) {
        return prev;
      }
      const next = new Map(prev);
      next.delete(drawerId);
      return next;
    });
  });

  const active = React.useMemo(() => {
    for (const open of openById.values()) {
      if (open) {
        return true;
      }
    }
    return false;
  }, [openById]);

  const contextValue = React.useMemo(
    () => ({
      setDrawerOpen,
      removeDrawer,
      active,
      swipeProgressStore,
      frontmostHeightStore,
    }),
    [active, frontmostHeightStore, removeDrawer, setDrawerOpen, swipeProgressStore],
  );

  return (
    <DrawerProviderContext.Provider value={contextValue}>{children}</DrawerProviderContext.Provider>
  );
}

export interface DrawerProviderState {}

export interface DrawerProviderProps {
  children?: React.ReactNode;
}

export namespace DrawerProvider {
  export type State = DrawerProviderState;
  export type Props = DrawerProviderProps;
}

type SwipeProgressListener = () => void;

function createSwipeProgressStore(): DrawerSwipeProgressStore {
  let progress = 0;
  const listeners = new Set<SwipeProgressListener>();

  return {
    getSnapshot: () => progress,
    set(nextProgress) {
      const resolvedProgress = Number.isFinite(nextProgress) ? nextProgress : 0;
      if (resolvedProgress === progress) {
        return;
      }

      progress = resolvedProgress;
      listeners.forEach((listener) => {
        listener();
      });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

function createFrontmostHeightStore(): DrawerFrontmostHeightStore {
  let height = 0;
  const listeners = new Set<SwipeProgressListener>();

  return {
    getSnapshot: () => height,
    set(nextHeight) {
      const resolvedHeight = Number.isFinite(nextHeight) ? nextHeight : 0;
      if (resolvedHeight === height) {
        return;
      }

      height = resolvedHeight;
      listeners.forEach((listener) => {
        listener();
      });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
