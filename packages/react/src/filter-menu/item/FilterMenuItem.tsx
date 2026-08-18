'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useFilterDropdownItem } from '../../filter-dropdown/item/useFilterDropdownItem';
import { MenuItem, type MenuItemProps } from '../../menu/item/MenuItem';

export const FilterMenuItem = React.forwardRef(function FilterMenuItem(
  props: FilterMenuItem.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { label, keywords, ...menuProps } = props;

  const { visible, ref } = useFilterDropdownItem({ label, keywords, children: props.children });
  const mergedRef = useMergedRefs(forwardedRef, ref);

  return visible ? <MenuItem {...menuProps} label={label} ref={mergedRef} /> : null;
});

export interface FilterMenuItemProps extends Omit<MenuItemProps, 'label' | 'keywords'> {
  /**
   * A text representation of the item used for filtering and keyboard text navigation.
   * Falls back to the rendered text.
   */
  label?: string | undefined;
  /**
   * Additional terms the item matches on when using the default filter.
   */
  keywords?: readonly string[] | undefined;
}

export namespace FilterMenuItem {
  export type Props = FilterMenuItemProps;
  export type State = MenuItem.State;
}
