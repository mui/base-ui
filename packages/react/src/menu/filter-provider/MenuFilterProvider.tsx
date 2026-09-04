'use client';
import * as React from 'react';
import { MenuFilterRoot } from '../filter-root/MenuFilterRoot';
import { MenuFilterSubmenuRoot } from '../filter-submenu-root/MenuFilterSubmenuRoot';
import type { MenuFilterRootFilterProps } from '../filter-root/MenuFilterRootFilterProps';
import { MenuFilterProviderContext } from './MenuFilterProviderContext';

/**
 * Makes the menu directly inside it filterable: the popup can render `Menu.FilterInput`,
 * `Menu.List`, `Menu.FilterClear`, `Menu.FilterEmpty`, and `Menu.FilterStatus`, and the
 * items filter against the query.
 * Wrap it around `Menu.Root` or `Menu.SubmenuRoot`. A submenu doesn't inherit it; wrap the
 * submenu's root in its own provider to filter it too. This is the only part that bundles the
 * filter implementation.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function MenuFilterProvider(props: MenuFilterProvider.Props): React.JSX.Element {
  const {
    children,
    filter,
    inputValue,
    defaultInputValue,
    onInputValueChange,
    autoHighlight,
    locale,
  } = props;

  const value = React.useMemo(
    () => ({
      Root: MenuFilterRoot,
      SubmenuRoot: MenuFilterSubmenuRoot,
      options: {
        filter,
        inputValue,
        defaultInputValue,
        onInputValueChange,
        autoHighlight,
        locale,
      },
    }),
    [filter, inputValue, defaultInputValue, onInputValueChange, autoHighlight, locale],
  );

  return (
    <MenuFilterProviderContext.Provider value={value}>
      {children}
    </MenuFilterProviderContext.Provider>
  );
}

export interface MenuFilterProviderProps extends MenuFilterRootFilterProps {
  children?: React.ReactNode;
}

export namespace MenuFilterProvider {
  export type Props = MenuFilterProviderProps;
}
