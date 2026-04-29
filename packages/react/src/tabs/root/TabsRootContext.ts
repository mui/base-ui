'use client';
import * as React from 'react';
import type { TabsTab } from '../tab/TabsTab';
import type { TabsRoot } from './TabsRoot';

export interface TabsRootContext {
  /**
   * The currently active tab's value.
   */
  value: TabsTab.Value;
  /**
   * Whether the selected value is controlled by the `value` prop.
   */
  isControlled: boolean;
  /**
   * Callback for setting new value.
   */
  onValueChange: (value: TabsTab.Value, eventDetails: TabsRoot.ChangeEventDetails) => void;
  /**
   * The component orientation (layout flow direction).
   */
  orientation: 'horizontal' | 'vertical';
  /**
   * Gets the element of the Tab with the given value.
   */
  getTabElementBySelectedValue: (selectedValue: TabsTab.Value | undefined) => HTMLElement | null;
  /**
   * Gets the `id` attribute of the Tab that corresponds to the given TabPanel value.
   * Returns `null` when no corresponding Tab has registered and `undefined` when
   * the registered Tab has no id assigned yet.
   */
  getTabIdByPanelValue: (panelValue: TabsTab.Value) => string | undefined | null;
  /**
   * Gets the `id` attribute of the TabPanel that corresponds to the given Tab value.
   */
  getTabPanelIdByValue: (tabValue: TabsTab.Value) => string | undefined;
  /**
   * Tabs rendered earlier in the current render pass.
   */
  renderedTabsRef: React.RefObject<TabsTab.Value[] | null>;
  registerMountedTabPanel: (panelValue: TabsTab.Value | number, panelId: string) => void;
  setTabMap: (
    map: Map<Node, (TabsTab.Metadata & { index?: number | null | undefined }) | null>,
  ) => void;
  unregisterMountedTabPanel: (panelValue: TabsTab.Value | number, panelId: string) => void;
  /**
   * The position of the active tab relative to the previously active tab.
   */
  tabActivationDirection: TabsTab.ActivationDirection;
  /**
   * Whether the initial tab registration pass has completed.
   */
  tabRegistrationSettled: boolean;
}

/**
 * @internal
 */
export const TabsRootContext = React.createContext<TabsRootContext | undefined>(undefined);

export function useTabsRootContext() {
  const context = React.useContext(TabsRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: TabsRootContext is missing. Tabs parts must be placed within <Tabs.Root>.',
    );
  }

  return context;
}
