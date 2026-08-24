'use client';
import * as React from 'react';

/** Internal bridge that lets collection components render `Draggable.KeyboardHandle`. */
export interface DraggableKeyboardHandleContext {
  setKeyboardHandleElement: (node: HTMLElement | null, token: object) => void;
  startKeyboardDrag: () => boolean;
  label: string | undefined;
  disabled: boolean;
}

export const DraggableKeyboardHandleContext =
  React.createContext<DraggableKeyboardHandleContext | null>(null);
