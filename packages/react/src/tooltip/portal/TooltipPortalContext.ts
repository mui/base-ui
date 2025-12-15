import * as React from 'react';
import { useContext } from '@base-ui/utils/useContext';

export const TooltipPortalContext = React.createContext<boolean | undefined>(undefined);

export function useTooltipPortalContext() {
  const value = useContext(TooltipPortalContext);
  if (value === undefined) {
    throw new Error('Base UI: <Tooltip.Portal> is missing.');
  }
  return value;
}
