'use client';

import * as React from 'react';
import type { PopoverRootContextValue } from './PopoverRoot.types';

export const PopoverContext = React.createContext<PopoverRootContextValue | null>(null);

export function usePopoverRootContext() {
  const context = React.useContext(PopoverContext);
  if (context === null) {
    throw new Error('Popover components must be used within the <Popover.Root> component');
  }
  return context;
}
