'use client';
import * as React from 'react';
import type { Side, Alignment } from '../../utils/useAnchorPositioning';

export interface PopoverPositionerContext {
  side: Side;
  alignment: Alignment;
  arrowRef: React.MutableRefObject<Element | null>;
  arrowUncentered: boolean;
  arrowStyles: React.CSSProperties;
}

export const PopoverPositionerContext = React.createContext<PopoverPositionerContext | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  PopoverPositionerContext.displayName = 'PopoverPositionerContext';
}

export function usePopoverPositionerContext() {
  const context = React.useContext(PopoverPositionerContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: PopoverPositionerContext is missing. PopoverPositioner parts must be placed within <Popover.Positioner>.',
    );
  }

  return context;
}
