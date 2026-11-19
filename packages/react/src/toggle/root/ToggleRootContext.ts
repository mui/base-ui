'use client';
import * as React from 'react';
import type { ToggleRootState } from './ToggleRoot';

export type ToggleRootContext = ToggleRootState;

export const ToggleRootContext = React.createContext<ToggleRootContext | undefined>(undefined);

export function useToggleRootContext() {
  const context = React.useContext(ToggleRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: ToggleRootContext is missing. ' +
        '<Toggle.Indicator> reads the pressed state from its parent toggle, so it cannot render on its own. ' +
        'Place it within <Toggle.Root>.',
    );
  }

  return context;
}
