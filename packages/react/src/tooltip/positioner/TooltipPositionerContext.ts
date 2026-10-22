'use client';
import * as React from 'react';
import type { PopupPositioning } from '../../utils/popups/popupPositioner';

export type TooltipPositionerContext = Pick<
  PopupPositioning,
  'side' | 'align' | 'arrowRef' | 'arrowUncentered' | 'arrowStyles' | 'instant'
>;

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
