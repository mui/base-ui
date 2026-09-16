'use client';
import * as React from 'react';
import type { FilterDropdownRoot as FilterDropdownRootNamespace } from '../../filter-dropdown/root/FilterDropdownRoot';
import { MenuRootInternal, type MenuRoot } from '../root/MenuRoot';
import type { MenuFilterRootFilterProps } from './MenuFilterRootFilterProps';
import { MenuFilterDropdown } from './MenuFilterDropdown';
import { useMenuFilterRoot } from './useMenuFilterRoot';

/**
 * The filterable implementation of `Menu.Root`, rendered in its place when the root sits inside
 * `Menu.FilterProvider`. Reached through the provider only, so a plain menu never bundles it.
 *
 * @internal
 */
export function MenuFilterRoot<Payload>(props: MenuFilterRoot.Props<Payload>): React.JSX.Element {
  const { children, rootProps, dropdownProps } = useMenuFilterRoot(props, 'MenuFilterRoot');

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

/**
 * Determines whether an item matches the current filter query.
 *
 * @param text The item's `label`, rendered text, or one of its `keywords`.
 * @param query The trimmed filter query.
 */
export type MenuFilterFunction = (text: string, query: string) => boolean;

export type MenuFilterRootProps<Payload = unknown> = Omit<
  MenuRoot.Props<Payload>,
  'closeParentOnEsc' | 'orientation'
> &
  MenuFilterRootFilterProps;

export interface MenuFilterRootState extends MenuRoot.State {}
export type MenuFilterRootActions = MenuRoot.Actions;
export type MenuFilterRootChangeEventReason = MenuRoot.ChangeEventReason;
export type MenuFilterRootChangeEventDetails = MenuRoot.ChangeEventDetails;
export type MenuFilterRootInputValueChangeEventReason =
  FilterDropdownRootNamespace.ChangeEventReason;
export type MenuFilterRootInputValueChangeEventDetails =
  FilterDropdownRootNamespace.ChangeEventDetails;

export namespace MenuFilterRoot {
  export type Props<Payload = unknown> = MenuFilterRootProps<Payload>;
  export type State = MenuFilterRootState;
  export type Actions = MenuFilterRootActions;
  export type ChangeEventReason = MenuFilterRootChangeEventReason;
  export type ChangeEventDetails = MenuFilterRootChangeEventDetails;
  export type InputValueChangeEventReason = MenuFilterRootInputValueChangeEventReason;
  export type InputValueChangeEventDetails = MenuFilterRootInputValueChangeEventDetails;
}
