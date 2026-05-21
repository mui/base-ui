'use client';
import * as React from 'react';

export interface DrawerVirtualKeyboardContext {
  onTouchStart: (event: React.TouchEvent<Element>) => void;
  /**
   * Returns `true` when the provider handled the touch by focusing a keyboard input,
   * so the caller should skip the normal swipe end handling.
   */
  onTouchEnd: (event: React.TouchEvent<Element>) => boolean;
  onTouchCancel: () => void;
}

export const DrawerVirtualKeyboardContext = React.createContext<
  DrawerVirtualKeyboardContext | undefined
>(undefined);

export function useDrawerVirtualKeyboardContext() {
  return React.useContext(DrawerVirtualKeyboardContext);
}
