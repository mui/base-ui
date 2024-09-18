'use client';
import * as React from 'react';
import type { CollapsibleRoot } from './CollapsibleRoot';

/**
 * @ignore - internal component.
 */
export const CollapsibleContext = React.createContext<CollapsibleRoot.Context | undefined>(
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
