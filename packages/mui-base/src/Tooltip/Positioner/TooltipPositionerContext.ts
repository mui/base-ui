'use client';
import * as React from 'react';
import type { Side, Alignment } from '../../utils/useAnchorPositioning';

export interface TooltipPositionerContext {
  open: boolean;
  side: Side;
  alignment: Alignment;
  arrowRef: React.MutableRefObject<Element | null>;
  arrowUncentered: boolean;
  arrowStyles: React.CSSProperties;
}

export const TooltipPositionerContext = React.createContext<TooltipPositionerContext | null>(null);

export function useTooltipPositionerContext() {
  const context = React.useContext(TooltipPositionerContext);
  if (context === null) {
    throw new Error(
      '<Tooltip.Popup> and <Tooltip.Arrow> must be used within the <Tooltip.Positioner> component',
    );
  }
  return context;
}
