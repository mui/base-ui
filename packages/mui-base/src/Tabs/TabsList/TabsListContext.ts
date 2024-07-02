import * as React from 'react';
import type { TabsReducerAction, TabsReducerState } from './tabsListReducer';
import { CompoundParentContextValue } from '../../useCompound';
import { TabMetadata } from '../Tab/Tab.types';

export type TabsListContextValue = {
  getTabElement: (value: any) => HTMLElement | null;
  dispatch: React.Dispatch<TabsReducerAction>;
  state: TabsReducerState;
  compoundParentContext: CompoundParentContextValue<any, TabMetadata>;
};

export const TabsListContext = React.createContext<TabsListContextValue | undefined>(undefined);

export function useTabsListContext() {
  const context = React.useContext(TabsListContext);
  if (context === undefined) {
    throw new Error('useTabsListContext must be used within a TabsList component');
  }

  return context;
}
