'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { FilterDropdown } from '../../filter-dropdown';
import { MenuItem, type MenuItemProps } from '../../menu/item/MenuItem';
import { MenuItemDataAttributes } from '../../menu/item/MenuItemDataAttributes';
import { useFilterDropdownRootContext } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { selectors } from '../../filter-dropdown/store';

export const FilterMenuItem = React.forwardRef(function FilterMenuItem(
  props: FilterMenuItem.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { label, keywords, render, ...menuProps } = props;
  const rootContext = useFilterDropdownRootContext();
  const itemId = useRefWithInit(() => Symbol('filter-menu-item')).current;
  const itemRef = React.useRef<HTMLDivElement | null>(null);
  const active = useStore(
    rootContext.navigationStore,
    selectors.isItemActive,
    itemRef,
    rootContext.listRef,
  );
  return (
    <FilterDropdown.Item
      ref={itemRef}
      itemId={itemId}
      label={label}
      keywords={keywords}
      role="menuitem"
      render={
        <MenuItem
          {...menuProps}
          tabIndex={undefined}
          ref={forwardedRef}
          render={render}
          {...{ [MenuItemDataAttributes.highlighted]: active ? '' : undefined }}
        />
      }
    />
  );
});

export interface FilterMenuItemProps extends Omit<MenuItemProps, 'keywords'> {
  keywords?: readonly string[] | undefined;
}

export namespace FilterMenuItem {
  export type Props = FilterMenuItemProps;
  export type State = MenuItem.State;
}
