'use client';
import * as React from 'react';
import { usePopoverPositioner } from './usePopoverPositioner';

export const PopoverPositionerContext = React.createContext<
  usePopoverPositioner.ReturnValue | undefined
>(undefined);

if (process.env.NODE_ENV !== 'production') {
  PopoverPositionerContext.displayName = 'PopoverPositionerContext';
}

export function usePopoverPositionerContext(optional: false): usePopoverPositioner.ReturnValue;
export function usePopoverPositionerContext(
  optional?: true,
): usePopoverPositioner.ReturnValue | undefined;
export function usePopoverPositionerContext(optional = true) {
  const context = React.useContext(PopoverPositionerContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: PopoverPositionerContext is missing. PopoverPositioner parts must be placed within <Popover.Positioner>.',
    );
  }

  return context;
}
