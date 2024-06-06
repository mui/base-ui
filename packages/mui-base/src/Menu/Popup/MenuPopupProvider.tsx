'use client';
import * as React from 'react';
import { ListContext, ListContextValue } from '../../useList/ListContext';
import { MenuItemMetadata } from '../Item/useMenuItem.types';
import { CompoundComponentContext, CompoundComponentContextValue } from '../../useCompound';

export type MenuPopupProviderValue = CompoundComponentContextValue<string, MenuItemMetadata> &
  ListContextValue<string>;

export interface MenuProviderProps {
  value: MenuPopupProviderValue;
  children: React.ReactNode;
}

/**
 * Sets up the contexts for the underlying MenuItem components.
 *
 * @ignore - do not document.
 */
export function MenuPopupProvider(props: MenuProviderProps) {
  const { value, children } = props;
  const { dispatch, getItemIndex, getItemState, registerItem, totalSubitemCount } = value;

  const listContextValue: ListContextValue<string> = React.useMemo(
    () => ({
      dispatch,
      getItemState,
      getItemIndex,
    }),
    [dispatch, getItemIndex, getItemState],
  );

  const compoundComponentContextValue: CompoundComponentContextValue<string, MenuItemMetadata> =
    React.useMemo(
      () => ({
        getItemIndex,
        registerItem,
        totalSubitemCount,
      }),
      [registerItem, getItemIndex, totalSubitemCount],
    );

  return (
    <CompoundComponentContext.Provider value={compoundComponentContextValue}>
      <ListContext.Provider value={listContextValue}>{children}</ListContext.Provider>
    </CompoundComponentContext.Provider>
  );
}
