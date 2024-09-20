'use client';
import * as React from 'react';

export const CompositeRootContext = React.createContext<CompositeRootContext.Value | null>(null);

export function useCompositeRootContext() {
  const context = React.useContext(CompositeRootContext);
  if (context === null) {
    throw new Error('<Composite.Item> must be used within <Composite.Root>');
  }
  return context;
}

export namespace CompositeRootContext {
  export interface Value {
    activeIndex: number;
    onActiveIndexChange: (index: number) => void;
  }
}
