'use client';
import * as React from 'react';
import type { MenuFilterRoot } from '../filter-root/MenuFilterRoot';
import type { MenuFilterSubmenuRoot } from '../filter-submenu-root/MenuFilterSubmenuRoot';
import type { MenuFilterProviderProps } from './MenuFilterProvider';

export type MenuFilterOptions = Omit<MenuFilterProviderProps, 'children'>;

/**
 * What `Menu.FilterProvider` hands to the root directly inside it: the filterable root
 * implementations (the provider is their only importer) and the filter props.
 */
export interface MenuFilterProviderContext {
  Root: typeof MenuFilterRoot;
  SubmenuRoot: typeof MenuFilterSubmenuRoot;
  options: MenuFilterOptions;
}

/**
 * Non-null only directly below a provider. The root that consumes it resets it, so a plain
 * `Menu.SubmenuRoot` inside a filterable menu stays plain.
 */
export const MenuFilterProviderContext = React.createContext<MenuFilterProviderContext | null>(
  null,
);
