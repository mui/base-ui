'use client';
import * as React from 'react';
import type { ToggleState } from './Toggle';

export type ToggleContext = ToggleState;

export const ToggleContext = React.createContext<ToggleContext | undefined>(undefined);

export function useToggleContext() {
  const context = React.useContext(ToggleContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: ToggleContext is missing. ' +
        '<ToggleIndicator> reads the pressed state from its parent toggle, so it cannot render on its own. ' +
        'Place it within <Toggle>.',
    );
  }

  return context;
}
