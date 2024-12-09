'use client';
import * as React from 'react';
import type { TextDirection } from '../../direction-provider/DirectionContext';
import { type TabMetadata } from '../tab/useTabsTab';
import type { TabActivationDirection, TabValue } from './TabsRoot';

export interface TabsRootContext {
  /**
   * The currently selected tab's value.
   */
  value: TabValue;
  /**
   * Callback for setting new value.
   */
  onValueChange: (
    value: TabValue,
    activationDirection: TabActivationDirection,
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
  getTabElementBySelectedValue: (selectedValue: TabValue | undefined) => HTMLElement | null;
  /**
   * Gets the `id` attribute of the Tab that corresponds to the given TabPanel value or index.
   * @param (any | undefined) panelValue Value to find the Tab for.
   * @param (number) index The index of the TabPanel to look for.
   */
  getTabIdByPanelValueOrIndex: (
    panelValue: TabValue | undefined,
    index: number,
  ) => string | undefined;
  /**
   * Gets the `id` attribute of the TabPanel that corresponds to the given Tab value or index.
   * @param (any | undefined) tabValue Value to find the Tab for.
   * @param (number) index The index of the Tab to look for.
   */
  getTabPanelIdByTabValueOrIndex: (tabValue: any, index: number) => string | undefined;
  setTabMap: (map: Map<Node, (TabMetadata & { index?: number | null }) | null>) => void;
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
