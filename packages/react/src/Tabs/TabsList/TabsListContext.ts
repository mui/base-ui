'use client';
import * as React from 'react';

export interface TabsListContext {
  activateOnFocus: boolean;
  getTabElement: (value: any) => HTMLElement | null;
  onTabActivation: (newValue: any, event: Event) => void;
  tabsListRef: React.RefObject<HTMLElement | null>;
}

export const TabsListContext = React.createContext<TabsListContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  TabsListContext.displayName = 'TabsListContext';
}

export function useTabsListContext() {
  const context = React.useContext(TabsListContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: TabsListContext is missing. TabsList parts must be placed within <Tabs.List>.',
    );
  }

  return context;
}
