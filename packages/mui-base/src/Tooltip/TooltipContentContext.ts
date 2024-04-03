import * as React from 'react';
import type { ContentContextValue } from './Tooltip.types';

export const TooltipContentContext = React.createContext<ContentContextValue | null>(null);

export function useTooltipContentContext() {
  const context = React.useContext(TooltipContentContext);
  if (context === null) {
    throw new Error('<Tooltip.Arrow> must be used within the <Tooltip.Content> component');
  }
  return context;
}
