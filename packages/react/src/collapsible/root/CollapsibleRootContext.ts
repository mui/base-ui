'use client';
import * as React from 'react';
import type { useCollapsibleRoot } from './useCollapsibleRoot';
import type { CollapsibleRoot } from './CollapsibleRoot';

export interface CollapsibleRootContext extends useCollapsibleRoot.ReturnValue {
  onOpenChange: (open: boolean) => void;
  state: CollapsibleRoot.State;
}

export const CollapsibleRootContext = React.createContext<CollapsibleRootContext | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  CollapsibleRootContext.displayName = 'CollapsibleRootContext';
}

export function useCollapsibleRootContext() {
  const context = React.useContext(CollapsibleRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: CollapsibleRootContext is missing. Collapsible parts must be placed within <Collapsible.Root>.',
    );
  }

  return context;
}
