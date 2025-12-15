import * as React from 'react';
import type { ToastObject } from '../useToastManager';
import { useContext } from '@base-ui/utils/useContext';

export interface ToastRootContext {
  toast: ToastObject<any>;
  rootRef: React.RefObject<HTMLElement | null>;
  titleId: string | undefined;
  setTitleId: React.Dispatch<React.SetStateAction<string | undefined>>;
  descriptionId: string | undefined;
  setDescriptionId: React.Dispatch<React.SetStateAction<string | undefined>>;
  swiping: boolean;
  swipeDirection: 'up' | 'down' | 'left' | 'right' | undefined;
  index: number;
  visibleIndex: number;
  expanded: boolean;
  recalculateHeight: (flushSync?: boolean) => void;
}

export const ToastRootContext = React.createContext<ToastRootContext | undefined>(undefined);

export function useToastRootContext(): ToastRootContext {
  const context = useContext(ToastRootContext);
  if (!context) {
    throw new Error(
      'Base UI: ToastRootContext is missing. Toast parts must be used within <Toast.Root>.',
    );
  }
  return context as ToastRootContext;
}
