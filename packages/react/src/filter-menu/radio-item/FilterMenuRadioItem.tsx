'use client';
import * as React from 'react';
import { FilterDropdown } from '../../filter-dropdown';
import { MenuRadioItem, type MenuRadioItemProps } from '../../menu/radio-item/MenuRadioItem';

export const FilterMenuRadioItem = React.forwardRef(function FilterMenuRadioItem(
  props: FilterMenuRadioItem.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { label, keywords, render, ...menuProps } = props;
  return (
    <FilterDropdown.Item
      label={label}
      keywords={keywords}
      role="menuitemradio"
      render={
        <MenuRadioItem {...menuProps} tabIndex={undefined} ref={forwardedRef} render={render} />
      }
    />
  );
});

export interface FilterMenuRadioItemProps extends Omit<MenuRadioItemProps, 'keywords'> {
  keywords?: readonly string[] | undefined;
}

export namespace FilterMenuRadioItem {
  export type Props = FilterMenuRadioItemProps;
  export type State = MenuRadioItem.State;
}
