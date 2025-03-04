import * as React from 'react';
import type { Toast } from '../provider/ToastProviderContext';

export interface ToastRootContext<Data = Record<string, unknown>> {
  toast: Toast<Data>;
  rootRef: React.RefObject<HTMLElement | null>;
  titleId: string | undefined;
  setTitleId: React.Dispatch<React.SetStateAction<string | undefined>>;
  descriptionId: string | undefined;
  setDescriptionId: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export const ToastRootContext = React.createContext<ToastRootContext<any> | undefined>(undefined);

export function useToastRootContext<Data = Record<string, unknown>>(): ToastRootContext<Data> {
  const context = React.useContext(ToastRootContext);
  if (!context) {
    throw new Error('useToastRoot must be used within a ToastRoot');
  }
  return context as ToastRootContext<Data>;
}
