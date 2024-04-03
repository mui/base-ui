import * as React from 'react';
import type { ContextValue } from './Tooltip.types';

export const TooltipContext = React.createContext<ContextValue | null>(null);

export function useTooltipContext() {
  const context = React.useContext(TooltipContext);
  if (context === null) {
    throw new Error('Tooltip components must be used within the <Tooltip.Root> component');
  }
  return context;
}
