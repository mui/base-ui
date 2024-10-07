'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { TabsListContext } from './TabsListContext';
import { TabMetadata } from '../Root/useTabsRoot';
import { ListContext, ListContextValue } from '../../useList/ListContext';
import { CompoundComponentContext, CompoundComponentContextValue } from '../../useCompound';
import { refType } from '../../utils/proptypes';

export type TabsListProviderValue = CompoundComponentContextValue<any, TabMetadata> &
  ListContextValue<any> &
  TabsListContext;

export interface TabsListProviderProps {
  value: TabsListProviderValue;
  children: React.ReactNode;
}

/**
 * Sets up the contexts for the underlying Tab components.
 *
 * @ignore - do not document.
 */
const TabsListProvider: React.FC<TabsListProviderProps> = function TabsListProvider(
  props: TabsListProviderProps,
) {
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

  const tabsListContextValue: TabsListContext = React.useMemo(
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
};

TabsListProvider.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * @ignore
   */
  value: PropTypes /* @typescript-to-proptypes-ignore */.shape({
    activateOnFocus: PropTypes.bool.isRequired,
    dispatch: PropTypes.func.isRequired,
    getItemIndex: PropTypes.func.isRequired,
    getItemState: PropTypes.func.isRequired,
    getTabElement: PropTypes.func.isRequired,
    registerItem: PropTypes.func.isRequired,
    tabsListRef: refType.isRequired,
    totalSubitemCount: PropTypes.number.isRequired,
  }).isRequired,
} as any;

export { TabsListProvider };
