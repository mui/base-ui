'use client';
import * as React from 'react';
import type { PopoverPositionerContextValue } from './PopoverPositioner.types';

export const PopoverPositionerContext = React.createContext<PopoverPositionerContextValue | null>(
  null,
);

export function usePopoverPositionerContext() {
  const context = React.useContext(PopoverPositionerContext);
  if (context === null) {
    throw new Error(
      '<Popover.Popup> and <Popover.Arrow> must be used within the <Popover.Positioner> component',
    );
  }
  return context;
}
