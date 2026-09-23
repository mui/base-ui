'use client';
import * as React from 'react';
import { MenuFilterRoot } from '../filter-root/MenuFilterRoot';
import { MenuFilterSubmenuRoot } from '../filter-submenu-root/MenuFilterSubmenuRoot';
import type { MenuFilterProviderOptions } from './MenuFilterProviderOptions';
import { MenuFilterProviderContext } from './MenuFilterProviderContext';
import type { FilterDropdownRoot } from '../../filter-dropdown/root/FilterDropdownRootContext';

/**
 * Makes the menu directly inside it filterable: the popup can render `Menu.Input`,
 * `Menu.Clear`, and `Menu.Empty`, and the items inside `Menu.List` filter against
 * the query.
 * Wrap it around `Menu.Root` or `Menu.SubmenuRoot`. A submenu doesn't inherit it; wrap the
 * submenu's root in its own provider to filter it too. This is the only part that bundles the
 * filter implementation.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuFilterProvider(props: MenuFilterProvider.Props): React.JSX.Element {
  const { children, filter, value, defaultValue, onValueChange, autoHighlight, locale } = props;

  const contextValue = React.useMemo(
    () => ({
      Root: MenuFilterRoot,
      SubmenuRoot: MenuFilterSubmenuRoot,
      options: {
        filter,
        value,
        defaultValue,
        onValueChange,
        autoHighlight,
        locale,
      },
    }),
    [filter, value, defaultValue, onValueChange, autoHighlight, locale],
  );

  return (
    <MenuFilterProviderContext.Provider value={contextValue}>
      {children}
    </MenuFilterProviderContext.Provider>
  );
}

export interface MenuFilterProviderProps extends MenuFilterProviderOptions {
  children?: React.ReactNode;
}

export type MenuFilterProviderValueChangeEventReason = FilterDropdownRoot.ChangeEventReason;
export type MenuFilterProviderValueChangeEventDetails = FilterDropdownRoot.ChangeEventDetails;

export namespace MenuFilterProvider {
  export type Props = MenuFilterProviderProps;
  export type ValueChangeEventReason = MenuFilterProviderValueChangeEventReason;
  export type ValueChangeEventDetails = MenuFilterProviderValueChangeEventDetails;
}
