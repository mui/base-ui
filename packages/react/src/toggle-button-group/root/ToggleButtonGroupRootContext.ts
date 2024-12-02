'use client';
import * as React from 'react';

export interface ToggleButtonGroupRootContext {
  value: readonly string[];
  setGroupValue: (newValue: string, nextPressed: boolean, event: Event) => void;
  disabled: boolean;
}

export const ToggleButtonGroupRootContext = React.createContext<
  ToggleButtonGroupRootContext | undefined
>(undefined);

if (process.env.NODE_ENV !== 'production') {
  ToggleButtonGroupRootContext.displayName = 'ToggleButtonGroupRootContext';
}

export function useToggleButtonGroupRootContext(optional = true) {
  const context = React.useContext(ToggleButtonGroupRootContext);
  if (context === undefined && !optional) {
    throw new Error(
      'Base UI: ToggleButtonGroupRootContext is missing. ToggleButtonGroup parts must be placed within <ToggleButtonGroup.Root>.',
    );
  }

  return context;
}
