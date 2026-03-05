'use client';
import * as React from 'react';
import type { TabsRoot } from '../root/TabsRoot';

export interface TabsListContext {
  activateOnFocus: boolean;
  highlightedTabIndex: number;
  registerIndicatorUpdateListener: (listener: () => void) => () => void;
  registerTabResizeObserverElement: (element: HTMLElement) => () => void;
  onTabActivation: (newValue: any, eventDetails: TabsRoot.ChangeEventDetails) => void;
  setHighlightedTabIndex: (index: number) => void;
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
