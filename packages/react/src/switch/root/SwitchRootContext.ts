import * as React from 'react';
import type { SwitchRoot } from './SwitchRoot';
import { throwMissingContextError } from '../../utils/errorHelper';

export type SwitchRootContext = SwitchRoot.State;

export const SwitchRootContext = React.createContext<SwitchRootContext | undefined>(undefined);

export function useSwitchRootContext() {
  const context = React.useContext(SwitchRootContext);
  if (context === undefined) {
    return throwMissingContextError('SwitchRootContext', 'Switch', 'Switch.Root');
  }

  return context;
}
