'use client';
import * as React from 'react';
import type { Side, Align } from '../../utils/useAnchorPositioning';

export interface TooltipPositionerContext {
  open: boolean;
  side: Side;
  align: Align;
  arrowRef: React.MutableRefObject<Element | null>;
  arrowUncentered: boolean;
  arrowStyles: React.CSSProperties;
}

export const TooltipPositionerContext = React.createContext<TooltipPositionerContext | undefined>(
  undefined,
);

export function useTooltipPositionerContext() {
  const context = React.useContext(TooltipPositionerContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: TooltipPositionerContext is missing. TooltipPositioner parts must be placed within <Tooltip.Positioner>.',
    );
  }
  return context;
}
