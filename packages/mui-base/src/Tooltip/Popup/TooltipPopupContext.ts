import * as React from 'react';
import type { TooltipPopupContextValue } from './TooltipPopup.types';

export const TooltipPopupContext = React.createContext<TooltipPopupContextValue | null>(null);

export function useTooltipPopupContext() {
  const context = React.useContext(TooltipPopupContext);
  if (context === null) {
    throw new Error('<Tooltip.Arrow> must be used within the <Tooltip.Popup> component');
  }
  return context;
}
