'use client';
import * as React from 'react';
import type { ToggleGroupOrientation } from './ToggleGroup';

export interface ToggleGroupContext {
  value: readonly any[];
  setGroupValue: (newValue: string, nextPressed: boolean, event: Event) => void;
  disabled: boolean;
  orientation: ToggleGroupOrientation;
}

export const ToggleGroupContext = React.createContext<ToggleGroupContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  ToggleGroupContext.displayName = 'ToggleGroupContext';
}

export function useToggleGroupContext(optional = true) {
  const context = React.useContext(ToggleGroupContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: ToggleGroupContext is missing. ToggleGroup parts must be placed within <ToggleGroup>.',
    );
  }

  return context;
}
