import * as React from 'react';
import { throwMissingContextError } from '../../utils/errorHelper';

export interface ToastViewportContext {
  viewportRef: React.RefObject<HTMLElement | null>;
}

export const ToastViewportContext = React.createContext<ToastViewportContext | undefined>(
  undefined,
);

export function useToastViewportContext() {
  const context = React.useContext(ToastViewportContext);
  if (!context) {
    return throwMissingContextError('ToastViewportContext', 'Toast', 'Toast.Viewport');
  }
  return context;
}
