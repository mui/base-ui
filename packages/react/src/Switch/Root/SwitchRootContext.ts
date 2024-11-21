import * as React from 'react';
import type { SwitchRoot } from './SwitchRoot';

export type SwitchRootContext = SwitchRoot.OwnerState;

export const SwitchRootContext = React.createContext<SwitchRootContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  SwitchRootContext.displayName = 'SwitchRootContext';
}

export function useSwitchRootContext() {
  const context = React.useContext(SwitchRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: SwitchRootContext is missing. Switch parts must be placed within <Switch.Root>.',
    );
  }

  return context;
}
