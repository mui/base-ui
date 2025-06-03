import * as React from 'react';
import { throwMissingContextError } from '../../utils/errorHelper';

export const TooltipPortalContext = React.createContext<boolean | undefined>(undefined);

export function useTooltipPortalContext() {
  const value = React.useContext(TooltipPortalContext);
  if (value === undefined) {
    return throwMissingContextError('TooltipPortalContext', 'Tooltip', 'Tooltip.Portal');
  }
  return value;
}
