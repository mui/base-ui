import * as React from 'react';

export interface ToastViewportContext {
  viewportRef: React.RefObject<HTMLElement | null>;
}

export const ToastViewportContext = React.createContext<ToastViewportContext | undefined>(
  undefined,
);

export function useToastViewportContext() {
  const context = React.useContext(ToastViewportContext);
  if (!context) {
    throw new Error(
      'Base UI: ToastViewportContext is missing. Toast parts must be placed within <Toast.Viewport>.',
    );
  }
  return context;
}
