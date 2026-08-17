'use client';
import * as React from 'react';

export interface TabsListContext {
  activateOnFocus: boolean;
  registerIndicatorUpdateListener: (listener: () => void) => () => void;
  registerTabResizeObserverElement: (element: HTMLElement) => () => void;
  tabsListElement: HTMLElement | null;
}

export const TabsListContext = React.createContext<TabsListContext | undefined>(undefined);

export function useTabsListContext() {
  const context = React.useContext(TabsListContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: TabsListContext is missing. TabsList parts must be placed within <Tabs.List>.',
    );
  }

  return context;
}
