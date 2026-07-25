'use client';
import * as React from 'react';

export interface DrawerProviderContext {
  setDrawerOpen: (drawerId: string, open: boolean) => void;
  removeDrawer: (drawerId: string) => void;
  active: boolean;
  visualStateStore: DrawerVisualStateStore;
}

export const DrawerProviderContext = React.createContext<DrawerProviderContext | undefined>(
  undefined,
);

export interface DrawerVisualState {
  swipeProgress: number;
  frontmostHeight: number;
}

export interface DrawerVisualStateStore {
  getSnapshot: () => DrawerVisualState;
  subscribe: (listener: () => void) => () => void;
  set: (state: Partial<DrawerVisualState>) => void;
}

export function useDrawerProviderContext() {
  return React.useContext(DrawerProviderContext);
}
