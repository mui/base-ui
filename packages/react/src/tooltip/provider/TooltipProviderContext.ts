'use client';
import * as React from 'react';

export interface TooltipProviderContext {
  open: number | undefined;
  close: number | undefined;
}

export const TooltipProviderContext = React.createContext<TooltipProviderContext | undefined>(
  undefined,
);

export function useTooltipProviderContext(): TooltipProviderContext | undefined {
  return React.useContext(TooltipProviderContext);
}
