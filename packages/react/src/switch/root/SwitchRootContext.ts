import * as React from 'react';
import type { SwitchRoot } from './SwitchRoot';
import { useContext } from '@base-ui/utils/useContext';

export type SwitchRootContext = SwitchRoot.State;

export const SwitchRootContext = React.createContext<SwitchRootContext | undefined>(undefined);

export function useSwitchRootContext() {
  const context = useContext(SwitchRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: SwitchRootContext is missing. Switch parts must be placed within <Switch.Root>.',
    );
  }

  return context;
}
