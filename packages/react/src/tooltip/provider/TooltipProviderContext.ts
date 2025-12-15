import * as React from 'react';
import { useContext } from '@base-ui/utils/useContext';

export interface TooltipProviderContext {
  delay: number | undefined;
  closeDelay: number | undefined;
}

export const TooltipProviderContext = React.createContext<TooltipProviderContext | undefined>(
  undefined,
);

export function useTooltipProviderContext(): TooltipProviderContext | undefined {
  return useContext(TooltipProviderContext);
}
