'use client';
import * as React from 'react';

export interface CompositeRootContext {
  highlightedIndex: number;
  onHighlightedIndexChange: (index: number) => void;
}

export const CompositeRootContext = React.createContext<CompositeRootContext | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  CompositeRootContext.displayName = 'CompositeRootContext';
}

export function useCompositeRootContext() {
  const context = React.useContext(CompositeRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: CompositeRootContext is missing. Composite parts must be placed within <Composite.Root>.',
    );
  }

  return context;
}
