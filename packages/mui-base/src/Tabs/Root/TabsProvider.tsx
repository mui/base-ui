'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
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
function TabsProvider(props: TabsProviderProps) {
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

TabsProvider.propTypes /* remove-proptypes */ = {
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
  value: PropTypes.shape({
    direction: PropTypes.oneOf(['ltr', 'rtl']).isRequired,
    getItemIndex: PropTypes.func.isRequired,
    getTabId: PropTypes.func.isRequired,
    getTabPanelId: PropTypes.func.isRequired,
    onSelected: PropTypes.func.isRequired,
    orientation: PropTypes.oneOf(['horizontal', 'vertical']).isRequired,
    registerItem: PropTypes.func.isRequired,
    registerTabIdLookup: PropTypes.func.isRequired,
    tabActivationDirection: PropTypes.oneOf(['down', 'left', 'none', 'right', 'up']).isRequired,
    totalSubitemCount: PropTypes.number.isRequired,
    value: PropTypes.any,
  }).isRequired,
} as any;

export { TabsProvider };
