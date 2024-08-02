'use client';
import * as React from 'react';
import { ProgressContextValue } from './ProgressRoot.types';

/**
 * @ignore - internal component.
 */
export const ProgressContext = React.createContext<ProgressContextValue | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  ProgressContext.displayName = 'ProgressContext';
}

export function useProgressContext() {
  const context = React.useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgressContext must be used inside a Progress component');
  }
  return context;
}
