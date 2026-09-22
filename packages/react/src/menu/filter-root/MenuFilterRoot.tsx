'use client';
import * as React from 'react';
import { MenuRootInternal, type MenuRoot } from '../root/MenuRoot';
import type { MenuFilterProviderOptions } from '../filter-provider/MenuFilterProviderOptions';
import { MenuFilterDropdown } from './MenuFilterDropdown';
import { useMenuFilterRoot } from './useMenuFilterRoot';

/**
 * The filterable implementation of `Menu.Root`, rendered in its place when the root sits inside
 * `Menu.FilterProvider`. Reached through the provider only, so a plain menu never bundles it.
 *
 * @internal
 */
export function MenuFilterRoot<Payload>(props: MenuFilterRootProps<Payload>): React.JSX.Element {
  const { children, rootProps, dropdownProps } = useMenuFilterRoot(props, 'MenuRoot');

  return (
    <MenuRootInternal
      {...rootProps}
      renderVirtualFocusChildren={(payload, inputProps) => (
        <MenuFilterDropdown {...dropdownProps} inputProps={inputProps}>
          {typeof children === 'function' ? children(payload) : children}
        </MenuFilterDropdown>
      )}
    />
  );
}

export type MenuFilterRootProps<Payload = unknown> = MenuRoot.Props<Payload> &
  MenuFilterProviderOptions;
