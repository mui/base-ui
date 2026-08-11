'use client';
import * as React from 'react';

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
}

export const MenuFilterIntegrationContext = React.createContext<MenuFilterIntegration | null>(null);

/**
 * Returns the filtering parts, or `null` for an ordinary menu. Its presence is what makes a menu
 * filterable, so parts can gate on it directly.
 */
export function useMenuFilterIntegration() {
  return React.useContext(MenuFilterIntegrationContext);
}
