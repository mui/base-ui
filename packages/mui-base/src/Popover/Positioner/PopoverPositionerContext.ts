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

export const PopoverPositionerContext = React.createContext<PopoverPositionerContext | null>(null);

export function usePopoverPositionerContext() {
  const context = React.useContext(PopoverPositionerContext);
  if (context === null) {
    throw new Error(
      '<Popover.Popup> and <Popover.Arrow> must be used within the <Popover.Positioner> component',
    );
  }
  return context;
}
