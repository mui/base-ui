import * as React from 'react';
import type { HoverCardRootContextValue } from './HoverCardRoot.types';

export const HoverCardRootContext = React.createContext<HoverCardRootContextValue | null>(null);

export function useHoverCardRootContext() {
  const context = React.useContext(HoverCardRootContext);
  if (context === null) {
    throw new Error('HoverCard components must be used within the <HoverCard.Root> component');
  }
  return context;
}
