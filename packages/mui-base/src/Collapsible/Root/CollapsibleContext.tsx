'use client';
import * as React from 'react';
import { CollapsibleContextValue } from './CollapsibleRoot.types';

/**
 * @ignore - internal component.
 */
export const CollapsibleContext = React.createContext<CollapsibleContextValue | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  CollapsibleContext.displayName = 'CollapsibleContext';
}

export function useCollapsibleContext() {
  const context = React.useContext(CollapsibleContext);
  if (context === undefined) {
    throw new Error('useCollapsibleContext must be used inside a Collapsible component');
  }
  return context;
}
