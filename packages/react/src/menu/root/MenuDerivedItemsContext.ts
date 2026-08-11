'use client';
import * as React from 'react';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';

export interface MenuDerivedItemsContext {
  /**
   * Whether the root was given an `items` data source. When false, the list is rendered by the
   * consumer and filtering falls back to matching the rendered DOM text.
   */
  hasItems: boolean;
  /**
   * `items` narrowed to the current query.
   */
  filteredItems: readonly any[];
}

const DEFAULT_CONTEXT: MenuDerivedItemsContext = {
  hasItems: false,
  filteredItems: EMPTY_ARRAY,
};

export const MenuDerivedItemsContext =
  React.createContext<MenuDerivedItemsContext>(DEFAULT_CONTEXT);

export function useMenuDerivedItemsContext() {
  return React.useContext(MenuDerivedItemsContext);
}
