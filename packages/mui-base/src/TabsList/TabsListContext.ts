import * as React from 'react';

export type TabsListContextValue = {
  activateOnFocus: boolean;
};

export const TabsListContext = React.createContext<TabsListContextValue | undefined>(undefined);

export function useTabsListContext() {
  const context = React.useContext(TabsListContext);
  if (context === undefined) {
    throw new Error('useTabsListContext must be used within a TabsList component');
  }

  return context;
}
