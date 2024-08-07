import * as React from 'react';

export interface CompositeRootContextValue {
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
}

export const CompositeRootContext = React.createContext<CompositeRootContextValue | null>(null);

export function useCompositeRootContext() {
  const context = React.useContext(CompositeRootContext);
  if (context === null) {
    throw new Error('<Composite.Item> must be used within <Composite.Root>');
  }
  return context;
}
