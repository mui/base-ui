'use client';
import * as React from 'react';

interface SelectGroupCollectionContext {
  items: readonly any[];
}

const SelectGroupCollectionContext = React.createContext<SelectGroupCollectionContext | null>(null);

export function useSelectGroupCollectionContext() {
  return React.useContext(SelectGroupCollectionContext);
}

export function SelectGroupCollectionProvider(props: SelectGroupCollectionProvider.Props) {
  const { children, items } = props;

  const contextValue = React.useMemo(() => ({ items }), [items]);

  return (
    <SelectGroupCollectionContext.Provider value={contextValue}>
      {children}
    </SelectGroupCollectionContext.Provider>
  );
}

namespace SelectGroupCollectionProvider {
  export interface Props {
    children: React.ReactNode;
    items: readonly any[];
  }
}
