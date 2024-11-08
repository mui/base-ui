'use client';
import * as React from 'react';
import type { Side, Alignment } from '../../utils/useAnchorPositioning.js';

export interface TooltipPositionerContext {
  open: boolean;
  side: Side;
  alignment: Alignment;
  arrowRef: React.MutableRefObject<Element | null>;
  arrowUncentered: boolean;
  arrowStyles: React.CSSProperties;
}

export const TooltipPositionerContext = React.createContext<TooltipPositionerContext | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  TooltipPositionerContext.displayName = 'TooltipPositionerContext';
}

export function useTooltipPositionerContext() {
  const context = React.useContext(TooltipPositionerContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: TooltipPositionerContext is missing. TooltipPositioner parts must be placed within <Tooltip.Positioner>.',
    );
  }
  return context;
}
