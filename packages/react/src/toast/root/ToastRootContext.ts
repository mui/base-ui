import * as React from 'react';
import type { Toast } from '../useToast';

export interface ToastRootContext {
  toast: Toast<any>;
  rootRef: React.RefObject<HTMLElement | null>;
  titleId: string | undefined;
  setTitleId: React.Dispatch<React.SetStateAction<string | undefined>>;
  descriptionId: string | undefined;
  setDescriptionId: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export const ToastRootContext = React.createContext<ToastRootContext | undefined>(undefined);

export function useToastRootContext(): ToastRootContext {
  const context = React.useContext(ToastRootContext);
  if (!context) {
    throw new Error('useToastRoot must be used within a ToastRoot');
  }
  return context as ToastRootContext;
}
