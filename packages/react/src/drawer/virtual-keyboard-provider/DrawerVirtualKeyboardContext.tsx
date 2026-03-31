'use client';
import * as React from 'react';

export interface DrawerVirtualKeyboardContext {
  availableHeight: number | null;
  keyboardInset: number;
  onTouchStart: (event: React.TouchEvent<Element>) => void;
  onTouchEnd: (event: React.TouchEvent<Element>) => boolean;
  onTouchCancel: () => void;
}

export const DrawerVirtualKeyboardContext = React.createContext<
  DrawerVirtualKeyboardContext | undefined
>(undefined);

export function useDrawerVirtualKeyboardContext(
  optional?: true,
): DrawerVirtualKeyboardContext | undefined;
export function useDrawerVirtualKeyboardContext(optional?: false): DrawerVirtualKeyboardContext;
export function useDrawerVirtualKeyboardContext(optional = false) {
  const drawerVirtualKeyboardContext = React.useContext(DrawerVirtualKeyboardContext);

  if (!optional && drawerVirtualKeyboardContext === undefined) {
    throw new Error(
      'Base UI: DrawerVirtualKeyboardContext is missing. The virtual keyboard provider must wrap the drawer parts that use it.',
    );
  }

  return drawerVirtualKeyboardContext;
}
