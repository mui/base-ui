'use client';
import * as React from 'react';
import type { Side, Align } from '../../internals/useAnchorPositioning';
import type { PopupPositioningContext } from '../../utils/popups/interaction-store/types';

export interface PopoverPositionerContext {
  side: Side;
  align: Align;
  arrowRef: React.RefObject<Element | null>;
  arrowUncentered: boolean;
  arrowStyles: React.CSSProperties;
  context: PopupPositioningContext;
}

export const PopoverPositionerContext = React.createContext<PopoverPositionerContext | undefined>(
  undefined,
);

export function usePopoverPositionerContext() {
  const context = React.useContext(PopoverPositionerContext);
  if (!context) {
    throw new Error(
      'Base UI: PopoverPositionerContext is missing. PopoverPositioner parts must be placed within <Popover.Positioner>.',
    );
  }
  return context;
}
