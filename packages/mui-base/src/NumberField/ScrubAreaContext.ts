import * as React from 'react';
import type { NumberFieldOwnerState } from './NumberField.types';

export const ScrubAreaContext = React.createContext<{
  isScrubbing: boolean;
  virtualCursorRef: React.RefObject<HTMLSpanElement>;
  ownerState: NumberFieldOwnerState;
  transform: string;
} | null>(null);

if (process.env.NODE_ENV !== 'production') {
  ScrubAreaContext.displayName = 'ScrubAreaContext';
}

export function useScrubAreaContext() {
  const context = React.useContext(ScrubAreaContext);
  if (context === null) {
    throw new Error('useScrubAreaContext must be used within a ScrubArea');
  }
  return context;
}
