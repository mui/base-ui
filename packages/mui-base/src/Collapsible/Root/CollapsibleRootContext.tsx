'use client';
import * as React from 'react';
import type { useCollapsibleRoot } from './useCollapsibleRoot';
import type { CollapsibleRoot } from './CollapsibleRoot';

export interface CollapsibleRootContext extends useCollapsibleRoot.ReturnValue {
  ownerState: CollapsibleRoot.OwnerState;
}
/**
 * @ignore - internal component.
 */
export const CollapsibleRootContext = React.createContext<CollapsibleRootContext | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  CollapsibleRootContext.displayName = 'CollapsibleRootContext';
}

export function useCollapsibleRootContext() {
  const context = React.useContext(CollapsibleRootContext);
  if (context === undefined) {
    throw new Error('useCollapsibleRootContext must be used inside a Collapsible component');
  }
  return context;
}
