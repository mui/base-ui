'use client';
import * as React from 'react';
import type { Side, Align } from '../../utils/useAnchorPositioning';
import { throwMissingContextError } from '../../utils/errorHelper';

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
    return throwMissingContextError(
      'TooltipPositionerContext',
      'TooltipPositioner',
      'Tooltip.Positioner',
    );
  }
  return context;
}
