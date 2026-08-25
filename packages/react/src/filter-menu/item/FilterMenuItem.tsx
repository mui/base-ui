'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useFilterDropdownItem } from '../../filter-dropdown/item/useFilterDropdownItem';
import { MenuItem, type MenuItemProps, type MenuItemState } from '../../menu/item/MenuItem';
import type { FilterMenuItemFilterProps } from '../utils/FilterMenuItemFilterProps';
import { useFilterMenuRowContext } from '../row/FilterMenuRowContext';

/**
 * An interactive item in the filter menu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Filter Menu](https://base-ui.com/react/components/filter-menu)
 */
export const FilterMenuItem = React.forwardRef(function FilterMenuItem(
  props: FilterMenuItem.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { label, keywords, ...menuProps } = props;

  const isGridCell = useFilterMenuRowContext();
  const { visible, ref } = useFilterDropdownItem({
    label,
    keywords,
    children: props.children,
  });
  const mergedRef = useMergedRefs(forwardedRef, ref);

  return visible ? (
    <MenuItem
      {...(isGridCell ? { role: 'gridcell' as const } : undefined)}
      {...menuProps}
      label={label}
      ref={mergedRef}
    />
  ) : null;
});

export interface FilterMenuItemProps
  extends Omit<MenuItemProps, 'label'>, FilterMenuItemFilterProps {}

export interface FilterMenuItemState extends MenuItemState {}

export namespace FilterMenuItem {
  export type Props = FilterMenuItemProps;
  export type State = FilterMenuItemState;
}
