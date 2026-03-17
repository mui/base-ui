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
   * @param (any) panelValue Value to find the Tab for.
   */
  getTabIdByPanelValue: (panelValue: TabsTab.Value) => string | undefined;
  /**
   * Gets the `id` attribute of the TabPanel that corresponds to the given Tab value.
   * @param (any) tabValue Value to find the TabPanel for.
   */
  getTabPanelIdByValue: (tabValue: TabsTab.Value) => string | undefined;
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
   * Ref populated by tabs during render with their values in render order.
   * Used for lazy direction computation when a tab is not yet in the map.
   */
  tabRenderOrderRef: React.RefObject<TabsTab.Value[]>;
  /**
   * Resolves the activation direction, falling back to render-order-based
   * computation when the state-based direction is 'none' due to a newly
   * added tab not yet being in the tab map.
   */
  resolveTabActivationDirection: () => TabsTab.ActivationDirection;
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
