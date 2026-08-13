'use client';
import * as React from 'react';
import type { MenuFilter, MenuRootInputValueChangeEventDetails } from './MenuRoot';

/**
 * The filtering parts, supplied by the `filter-menu` entrypoint.
 *
 * Menu renders these instead of importing them, so an ordinary `@base-ui/react/menu` consumer never
 * pulls the filtering implementation into their bundle. A static import here would defeat that: the
 * branch is decided at runtime, so no bundler could drop it.
 */
export interface MenuFilterIntegration {
  Root: React.ComponentType<any>;
  Trigger: React.ComponentType<any>;
  Popup: React.ComponentType<any>;
  List: React.ComponentType<any>;
  Item: React.ComponentType<any>;
  Group: React.ComponentType<any>;
}

// These are deliberately not a discriminated union on `filter`. `Omit`, `Pick`, and object rest
// all collapse a union into one object type with widened members, which then matches no branch,
// so a typed wrapper like `interface MyProps extends Omit<FilterMenu.Root.Props, 'children'>`
// would not compile.
export interface MenuFilterProps {
  /**
   * Customizes how items match the query. The function receives the item's `label` (falling
   * back to its rendered text) and the trimmed query.
   */
  filter?: MenuFilter | undefined;
  /**
   * The uncontrolled input value when the menu is initially rendered.
   *
   * To render a controlled filter input, use the `inputValue` prop instead.
   * @default ''
   */
  defaultInputValue?: string | undefined;
  /**
   * The input value. Use when controlled.
   */
  inputValue?: string | undefined;
  /**
   * Event handler called when the input value changes.
   */
  onInputValueChange?:
    | ((value: string, eventDetails: MenuRootInputValueChangeEventDetails) => void)
    | undefined;
}

/**
 * The filtering parts plus the filter configuration from the `FilterMenu` root's props. The root
 * feeds it through context so ordinary `Menu.Root` carries none of the filter-only props.
 */
export interface MenuFilterConfig extends MenuFilterProps {
  integration: MenuFilterIntegration;
}

export const MenuFilterIntegrationContext = React.createContext<MenuFilterConfig | null>(null);

/**
 * Returns the filter configuration, or `null` for an ordinary menu. Its presence is what makes a
 * menu filterable, so parts can gate on it directly.
 */
export function useMenuFilterIntegration() {
  return React.useContext(MenuFilterIntegrationContext);
}
