'use client';
import * as React from 'react';
import { TabsContext, TabsContextValue } from './TabsContext';
import { CompoundComponentContext, CompoundComponentContextValue } from '../../useCompound';

export type TabPanelMetadata = {
  id: string | undefined;
  ref: React.RefObject<HTMLElement>;
};

export type TabsProviderValue = CompoundComponentContextValue<any, TabPanelMetadata> &
  TabsContextValue;

export interface TabsProviderProps {
  value: TabsProviderValue;
  children: React.ReactNode;
}

/**
 * Sets up the contexts for the underlying Tab and TabPanel components.
 *
 * @ignore - do not document.
 */
export function TabsProvider(props: TabsProviderProps) {
  const { value: valueProp, children } = props;
  const {
    direction,
    getItemIndex,
    onSelected,
    orientation,
    registerItem,
    registerTabIdLookup,
    totalSubitemCount,
    value,
    getTabId,
    getTabPanelId,
    tabActivationDirection,
  } = valueProp;

  const compoundComponentContextValue: CompoundComponentContextValue<any, TabPanelMetadata> =
    React.useMemo(
      () => ({
        getItemIndex,
        registerItem,
        totalSubitemCount,
      }),
      [registerItem, getItemIndex, totalSubitemCount],
    );

  const tabsContextValue: TabsContextValue = React.useMemo(
    () => ({
      direction,
      getTabId,
      getTabPanelId,
      onSelected,
      orientation,
      registerTabIdLookup,
      value,
      tabActivationDirection,
    }),
    [
      direction,
      getTabId,
      getTabPanelId,
      onSelected,
      orientation,
      registerTabIdLookup,
      value,
      tabActivationDirection,
    ],
  );

  return (
    <CompoundComponentContext.Provider value={compoundComponentContextValue}>
      <TabsContext.Provider value={tabsContextValue}>{children}</TabsContext.Provider>
    </CompoundComponentContext.Provider>
  );
}
