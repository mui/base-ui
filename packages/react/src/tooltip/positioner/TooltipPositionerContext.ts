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

if (process.env.NODE_ENV !== 'production') {
  TooltipPositionerContext.displayName = 'TooltipPositionerContext';
}

export function useTooltipPositionerContext(optional: false): TooltipPositionerContext;
export function useTooltipPositionerContext(optional?: true): TooltipPositionerContext | undefined;
export function useTooltipPositionerContext(optional = true) {
  const context = React.useContext(TooltipPositionerContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: TooltipPositionerContext is missing. TooltipPositioner parts must be placed within <Tooltip.Positioner>.',
    );
  }
  return context;
}
