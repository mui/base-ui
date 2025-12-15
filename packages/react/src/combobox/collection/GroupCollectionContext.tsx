'use client';
import * as React from 'react';
import { useMemo } from '@base-ui/utils/useMemo';
import { useContext } from '@base-ui/utils/useContext';

interface GroupCollectionContext {
  items: readonly any[];
}

const GroupCollectionContext = React.createContext<GroupCollectionContext | null>(null);

export function useGroupCollectionContext() {
  return useContext(GroupCollectionContext);
}

export function GroupCollectionProvider(props: GroupCollectionProvider.Props) {
  const { children, items } = props;

  const contextValue = useMemo(() => ({ items }), [items]);

  return (
    <GroupCollectionContext.Provider value={contextValue}>
      {children}
    </GroupCollectionContext.Provider>
  );
}

namespace GroupCollectionProvider {
  export interface Props {
    children: React.ReactNode;
    items: readonly any[];
  }
}
