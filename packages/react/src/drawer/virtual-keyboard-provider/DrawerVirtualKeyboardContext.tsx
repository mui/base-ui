'use client';
import * as React from 'react';

export interface DrawerVirtualKeyboardContext {
  onTouchStart: (event: React.TouchEvent<Element>) => void;
  onTouchEnd: (event: React.TouchEvent<Element>) => void;
  onTouchCancel: () => void;
}

export const DrawerVirtualKeyboardContext = React.createContext<
  DrawerVirtualKeyboardContext | undefined
>(undefined);

export function useDrawerVirtualKeyboardContext() {
  return React.useContext(DrawerVirtualKeyboardContext);
}
