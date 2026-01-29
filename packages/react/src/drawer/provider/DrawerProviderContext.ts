'use client';
import * as React from 'react';

export interface DrawerProviderContext {
  setDrawerOpen: (drawerId: string, open: boolean) => void;
  removeDrawer: (drawerId: string) => void;
  active: boolean;
  swipeProgressStore: DrawerSwipeProgressStore;
  frontmostHeightStore: DrawerFrontmostHeightStore;
}

export const DrawerProviderContext = React.createContext<DrawerProviderContext | undefined>(
  undefined,
);

export interface DrawerSwipeProgressStore {
  getSnapshot: () => number;
  subscribe: (listener: () => void) => () => void;
  set: (progress: number) => void;
}

export interface DrawerFrontmostHeightStore {
  getSnapshot: () => number;
  subscribe: (listener: () => void) => () => void;
  set: (height: number) => void;
}

export function useDrawerProviderContext(optional?: false): DrawerProviderContext;
export function useDrawerProviderContext(optional: true): DrawerProviderContext | undefined;
export function useDrawerProviderContext(optional?: boolean) {
  const context = React.useContext(DrawerProviderContext);

  if (optional === false && context === undefined) {
    throw new Error('Base UI: DrawerProviderContext is missing. Use <Drawer.Provider>.');
  }

  return context;
}
