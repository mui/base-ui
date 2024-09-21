'use client';
import * as React from 'react';

export interface TabsListContext {
  activateOnFocus: boolean;
  getTabElement: (value: any) => HTMLElement | null;
  tabsListRef: React.RefObject<HTMLElement>;
}

export const TabsListContext = React.createContext<TabsListContext | undefined>(undefined);

export function useTabsListContext() {
  const context = React.useContext(TabsListContext);
  if (context === undefined) {
    throw new Error('useTabsListContext must be used within a TabsList component');
  }

  return context;
}
