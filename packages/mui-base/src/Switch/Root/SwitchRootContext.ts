import * as React from 'react';
import type { SwitchRoot } from './SwitchRoot';

export type SwitchRootContext = SwitchRoot.OwnerState;

export const SwitchRootContext = React.createContext<SwitchRootContext | undefined>(undefined);

export function useSwitchRootContext() {
  const context = React.useContext(SwitchRootContext);
  if (context === undefined) {
    throw new Error('useSwitchRootContext must be used within a SwitchRootProvider');
  }

  return context;
}
