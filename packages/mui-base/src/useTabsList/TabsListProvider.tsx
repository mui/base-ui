'use client';
import * as React from 'react';
import { ListContext, ListContextValue } from '../useList/ListContext';
import { TabMetadata } from '../useTabs';
import { CompoundComponentContext, CompoundComponentContextValue } from '../useCompound';
import { TabsListContext, TabsListContextValue } from './TabsListContext';

export type TabsListProviderValue = CompoundComponentContextValue<any, TabMetadata> &
  ListContextValue<any> &
  TabsListContextValue;

export interface TabsListProviderProps {
  value: TabsListProviderValue;
  children: React.ReactNode;
}

/**
 * Sets up the contexts for the underlying Tab components.
 *
 * @ignore - do not document.
 */
export function TabsListProvider(props: TabsListProviderProps) {
  const { value, children } = props;
  const {
    dispatch,
    getItemIndex,
    getItemState,
    registerItem,
    totalSubitemCount,
    activateOnFocus,
    getTabElement,
    tabsListRef,
  } = value;

  const listContextValue: ListContextValue<any> = React.useMemo(
    () => ({
      dispatch,
      getItemState,
      getItemIndex,
    }),
    [dispatch, getItemIndex, getItemState],
  );

  const compoundComponentContextValue: CompoundComponentContextValue<any, TabMetadata> =
    React.useMemo(
      () => ({
        getItemIndex,
        registerItem,
        totalSubitemCount,
      }),
      [registerItem, getItemIndex, totalSubitemCount],
    );

  const tabsListContextValue: TabsListContextValue = React.useMemo(
    () => ({ activateOnFocus, getTabElement, tabsListRef }),
    [activateOnFocus, getTabElement, tabsListRef],
  );

  return (
    <CompoundComponentContext.Provider value={compoundComponentContextValue}>
      <ListContext.Provider value={listContextValue}>
        <TabsListContext.Provider value={tabsListContextValue}>{children}</TabsListContext.Provider>
      </ListContext.Provider>
    </CompoundComponentContext.Provider>
  );
}
