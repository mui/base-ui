'use client';
import * as React from 'react';
import { throwMissingContextError } from '../../utils/errorHelper';

export interface TabsListContext {
  activateOnFocus: boolean;
  highlightedTabIndex: number;
  onTabActivation: (newValue: any, event: Event) => void;
  setHighlightedTabIndex: (index: number) => void;
  tabsListRef: React.RefObject<HTMLElement | null>;
}

export const TabsListContext = React.createContext<TabsListContext | undefined>(undefined);

export function useTabsListContext() {
  const context = React.useContext(TabsListContext);
  if (context === undefined) {
    return throwMissingContextError('TabsListContext', 'TabsList', 'Tabs.List');
  }

  return context;
}
