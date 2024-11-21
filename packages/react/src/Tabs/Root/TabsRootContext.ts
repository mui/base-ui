'use client';
import * as React from 'react';
import { type TabActivationDirection } from './TabsRoot';

export interface TabsRootContext {
  /**
   * The currently selected tab's value.
   */
  value?: any | null;
  /**
   * Callback for setting new value.
   */
  onSelected: (
    event: Event | undefined,
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
}

/**
 * @ignore - internal component.
 */
const TabsRootContext = React.createContext<TabsRootContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  TabsRootContext.displayName = 'TabsRootContext';
}

export function useTabsRootContext() {
  const context = React.useContext(TabsRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: TabsRootContext is missing. Tabs parts must be placed within <Tabs.Root>.',
    );
  }

  return context;
}

export { TabsRootContext };
