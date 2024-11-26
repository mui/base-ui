'use client';
import * as React from 'react';
import type { ProgressRoot } from './ProgressRoot';
import type { useProgressRoot } from './useProgressRoot';

export type ProgressRootContext = Omit<useProgressRoot.ReturnValue, 'getRootProps'> & {
  state: ProgressRoot.State;
};

/**
 * @ignore - internal component.
 */
export const ProgressRootContext = React.createContext<ProgressRootContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  ProgressRootContext.displayName = 'ProgressRootContext';
}

export function useProgressRootContext() {
  const context = React.useContext(ProgressRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: ProgressRootContext is missing. Progress parts must be placed within <Progress.Root>.',
    );
  }

  return context;
}
