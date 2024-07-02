import * as React from 'react';
import { type TabActivationDirection } from './TabsRoot.types';
import { CompoundParentContextValue } from '../../useCompound/useCompound.types';
import { TabPanelMetadata } from '../TabPanel/TabPanel.types';

export interface TabsContextValue {
  /**
   * The currently selected tab's value.
   */
  value?: any | null;
  /**
   * Callback for setting new value.
   */
  onSelected: (
    event: React.SyntheticEvent | Event | null,
    value: any | null,
    activationDirection: TabActivationDirection,
  ) => void;
  /**
   * The component orientation (layout flow direction).
   */
  orientation: 'horizontal' | 'vertical';
  /**
   * The direction of the tabs.
   */
  direction: 'ltr' | 'rtl';
  /**
   * Registers a function that returns the id of the tab with the given value.
   */
  registerTabIdLookup: (lookupFunction: (id: any) => string | undefined) => void;
  /**
   * Gets the id of the tab with the given value.
   * @param value Value to find the tab for.
   */
  getTabId: (value: any) => string | undefined;
  /**
   * Gets the id of the tab panel with the given value.
   * @param value Value to find the tab panel for.
   */
  getTabPanelId: (value: any) => string | undefined;
  /**
   * The position of the active tab relative to the previously active tab.
   */
  tabActivationDirection: TabActivationDirection;
  compoundParentContext: CompoundParentContextValue<any, TabPanelMetadata>;
}

/**
 * @ignore - internal component.
 */
const TabsContext = React.createContext<TabsContextValue | null>(null);

if (process.env.NODE_ENV !== 'production') {
  TabsContext.displayName = 'TabsContext';
}

export function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (context == null) {
    throw new Error('No TabsContext provided');
  }

  return context;
}

export { TabsContext };
