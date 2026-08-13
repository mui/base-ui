'use client';
import * as React from 'react';
import { FilterDropdown } from '../../filter-dropdown';
import { MenuLinkItem, type MenuLinkItemProps } from '../../menu/link-item/MenuLinkItem';

export const FilterMenuLinkItem = React.forwardRef(function FilterMenuLinkItem(
  props: FilterMenuLinkItem.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { label, keywords, render, ...menuProps } = props;
  return (
    <FilterDropdown.Item
      label={label}
      keywords={keywords}
      role="menuitem"
      render={
        <MenuLinkItem {...menuProps} tabIndex={undefined} ref={forwardedRef} render={render} />
      }
    />
  );
});

export interface FilterMenuLinkItemProps extends Omit<MenuLinkItemProps, 'keywords'> {
  keywords?: readonly string[] | undefined;
}

export namespace FilterMenuLinkItem {
  export type Props = FilterMenuLinkItemProps;
  export type State = MenuLinkItem.State;
}
