'use client';
import * as React from 'react';
import type { TextDirection } from '../../direction-provider/DirectionContext';
import type { TabsTab } from '../tab/TabsTab';
import { throwMissingContextError } from '../../utils/errorHelper';

export interface TabsRootContext {
  /**
   * The currently selected tab's value.
   */
  value: TabsTab.Value;
  /**
   * Callback for setting new value.
   */
  onValueChange: (
    value: TabsTab.Value,
    activationDirection: TabsTab.ActivationDirection,
    event: Event,
  ) => void;
  /**
   * Sets ArrowLeft and ArrowRight behavior based on text direction.
   * @default 'ltr'
   */
  direction: TextDirection;
  /**
   * The component orientation (layout flow direction).
   */
  orientation: 'horizontal' | 'vertical';
  /**
   * Gets the element of the Tab with the given value.
   * @param {any | undefined} value Value to find the tab for.
   */
  getTabElementBySelectedValue: (selectedValue: TabsTab.Value | undefined) => HTMLElement | null;
  /**
   * Gets the `id` attribute of the Tab that corresponds to the given TabPanel value or index.
   * @param (any | undefined) panelValue Value to find the Tab for.
   * @param (number) index The index of the TabPanel to look for.
   */
  getTabIdByPanelValueOrIndex: (
    panelValue: TabsTab.Value | undefined,
    index: number,
  ) => string | undefined;
  /**
   * Gets the `id` attribute of the TabPanel that corresponds to the given Tab value or index.
   * @param (any | undefined) tabValue Value to find the Tab for.
   * @param (number) index The index of the Tab to look for.
   */
  getTabPanelIdByTabValueOrIndex: (tabValue: any, index: number) => string | undefined;
  setTabMap: (map: Map<Node, (TabsTab.Metadata & { index?: number | null }) | null>) => void;
  /**
   * The position of the active tab relative to the previously active tab.
   */
  tabActivationDirection: TabsTab.ActivationDirection;
}

/**
 * @internal
 */
export const TabsRootContext = React.createContext<TabsRootContext | undefined>(undefined);

export function useTabsRootContext() {
  const context = React.useContext(TabsRootContext);
  if (context === undefined) {
    return throwMissingContextError('TabsRootContext', 'Tabs', 'Tabs.Root');
  }

  return context;
}
