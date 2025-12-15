'use client';
import * as React from 'react';
import type { Side, Align } from '../../utils/useAnchorPositioning';
import { useContext } from '@base-ui/utils/useContext';

export interface ToastPositionerContext {
  side: Side;
  align: Align;
  arrowRef: React.RefObject<Element | null>;
  arrowUncentered: boolean;
  arrowStyles: React.CSSProperties;
}

export const ToastPositionerContext = React.createContext<ToastPositionerContext | undefined>(
  undefined,
);

export function useToastPositionerContext() {
  const context = useContext(ToastPositionerContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: ToastPositionerContext is missing. ToastPositioner parts must be placed within <Toast.Positioner>.',
    );
  }
  return context;
}
