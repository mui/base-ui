import * as React from 'react';
import type { ToastObject } from '../useToastManager';
import { throwMissingContextError } from '../../utils/errorHelper';

export interface ToastRootContext {
  toast: ToastObject<any>;
  rootRef: React.RefObject<HTMLElement | null>;
  titleId: string | undefined;
  setTitleId: React.Dispatch<React.SetStateAction<string | undefined>>;
  descriptionId: string | undefined;
  setDescriptionId: React.Dispatch<React.SetStateAction<string | undefined>>;
  swipeDirection: 'up' | 'down' | 'left' | 'right' | undefined;
}

export const ToastRootContext = React.createContext<ToastRootContext | undefined>(undefined);

export function useToastRootContext(): ToastRootContext {
  const context = React.useContext(ToastRootContext);
  if (!context) {
    return throwMissingContextError('ToastRootContext', 'Toast', 'Toast.Root');
  }
  return context as ToastRootContext;
}
