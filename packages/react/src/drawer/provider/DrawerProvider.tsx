'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { DrawerProviderContext } from './DrawerProviderContext';
import type { DrawerVisualState, DrawerVisualStateStore } from './DrawerProviderContext';

/**
 * Provides a shared context for coordinating global Drawer UI, such as indent/background effects based on whether any Drawer is open.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export function DrawerProvider(props: DrawerProvider.Props) {
  const { children } = props;

  const openDrawersRef = useRefWithInit(() => new Set<object>());
  const [active, setActive] = React.useState(false);
  const [visualStateStore] = React.useState(createVisualStateStore);

  const setDrawerOpen = useStableCallback((drawer: object, open: boolean) => {
    const openDrawers = openDrawersRef.current;
    if (openDrawers.has(drawer) === open) {
      return;
    }

    if (open) {
      openDrawers.add(drawer);
    } else {
      openDrawers.delete(drawer);
    }
    setActive(openDrawers.size > 0);
  });

  const removeDrawer = useStableCallback((drawer: object) => {
    setDrawerOpen(drawer, false);
  });

  const contextValue = React.useMemo(
    () => ({
      setDrawerOpen,
      removeDrawer,
      active,
      visualStateStore,
    }),
    [active, removeDrawer, setDrawerOpen, visualStateStore],
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

type VisualStateListener = () => void;

function createVisualStateStore(): DrawerVisualStateStore {
  let state: DrawerVisualState = {
    swipeProgress: 0,
    frontmostHeight: 0,
  };
  const listeners = new Set<VisualStateListener>();

  return {
    getSnapshot: () => state,
    set(nextState) {
      let nextSwipeProgress = state.swipeProgress;
      if (nextState.swipeProgress !== undefined) {
        nextSwipeProgress = Number.isFinite(nextState.swipeProgress) ? nextState.swipeProgress : 0;
      }

      let nextFrontmostHeight = state.frontmostHeight;
      if (nextState.frontmostHeight !== undefined) {
        nextFrontmostHeight = Number.isFinite(nextState.frontmostHeight)
          ? nextState.frontmostHeight
          : 0;
      }

      if (
        nextSwipeProgress === state.swipeProgress &&
        nextFrontmostHeight === state.frontmostHeight
      ) {
        return;
      }

      state = {
        swipeProgress: nextSwipeProgress,
        frontmostHeight: nextFrontmostHeight,
      };

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
