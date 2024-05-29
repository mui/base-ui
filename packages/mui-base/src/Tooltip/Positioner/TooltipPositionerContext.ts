import * as React from 'react';
import type { TooltipPositionerContextValue } from './TooltipPositioner.types';

export const TooltipPositionerContext = React.createContext<TooltipPositionerContextValue | null>(
  null,
);

export function useTooltipPositionerContext() {
  const context = React.useContext(TooltipPositionerContext);
  if (context === null) {
    throw new Error(
      '<Tooltip.Popup> and <Tooltip.Arrow> must be used within the <Tooltip.Positioner> component',
    );
  }
  return context;
}
