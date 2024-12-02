'use client';
import * as React from 'react';

export interface ToggleGroupRootContext {
  value: readonly any[];
  setGroupValue: (newValue: string, nextPressed: boolean, event: Event) => void;
  disabled: boolean;
}

export const ToggleGroupRootContext = React.createContext<ToggleGroupRootContext | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  ToggleGroupRootContext.displayName = 'ToggleGroupRootContext';
}

export function useToggleGroupRootContext(optional = true) {
  const context = React.useContext(ToggleGroupRootContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: ToggleGroupRootContext is missing. ToggleGroup parts must be placed within <ToggleGroup.Root>.',
    );
  }

  return context;
}
