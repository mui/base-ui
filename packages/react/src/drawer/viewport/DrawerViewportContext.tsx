'use client';
import * as React from 'react';

interface DrawerViewportContextValue {
  swiping: boolean;
  getDragStyles: () => React.CSSProperties;
  swipeStrength: number | null;
  setSwipeDismissed: (dismissed: boolean) => void;
}

export const DrawerViewportContext = React.createContext<DrawerViewportContextValue | null>(null);

export function useDrawerViewportContext() {
  return React.useContext(DrawerViewportContext);
}
