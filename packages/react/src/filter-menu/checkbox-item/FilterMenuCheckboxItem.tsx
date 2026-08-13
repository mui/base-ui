'use client';
import * as React from 'react';
import { FilterDropdown } from '../../filter-dropdown';
import {
  MenuCheckboxItem,
  type MenuCheckboxItemProps,
} from '../../menu/checkbox-item/MenuCheckboxItem';

export const FilterMenuCheckboxItem = React.forwardRef(function FilterMenuCheckboxItem(
  props: FilterMenuCheckboxItem.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { label, keywords, render, ...menuProps } = props;
  return (
    <FilterDropdown.Item
      label={label}
      keywords={keywords}
      role="menuitemcheckbox"
      render={
        <MenuCheckboxItem {...menuProps} tabIndex={undefined} ref={forwardedRef} render={render} />
      }
    />
  );
});

export interface FilterMenuCheckboxItemProps extends Omit<MenuCheckboxItemProps, 'keywords'> {
  keywords?: readonly string[] | undefined;
}

export namespace FilterMenuCheckboxItem {
  export type Props = FilterMenuCheckboxItemProps;
  export type State = MenuCheckboxItem.State;
  export type ChangeEventReason = MenuCheckboxItem.ChangeEventReason;
  export type ChangeEventDetails = MenuCheckboxItem.ChangeEventDetails;
}
