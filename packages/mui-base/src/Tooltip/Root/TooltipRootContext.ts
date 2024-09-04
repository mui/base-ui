'use client';

import * as React from 'react';
import type { TooltipRootContextValue } from './TooltipRoot.types';

export const TooltipRootContext = React.createContext<TooltipRootContextValue | null>(null);

export function useTooltipRootContext() {
  const context = React.useContext(TooltipRootContext);
  if (context === null) {
    throw new Error('Tooltip components must be used within the <Tooltip.Root> component');
  }
  return context;
}
