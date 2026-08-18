'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useFilterDropdownItem } from '../../filter-dropdown/item/useFilterDropdownItem';
import {
  MenuCheckboxItem,
  type MenuCheckboxItemProps,
} from '../../menu/checkbox-item/MenuCheckboxItem';

export const FilterMenuCheckboxItem = React.forwardRef(function FilterMenuCheckboxItem(
  props: FilterMenuCheckboxItem.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { label, keywords, ...menuProps } = props;

  const { visible, ref } = useFilterDropdownItem({ label, keywords, children: props.children });
  const mergedRef = useMergedRefs(forwardedRef, ref);

  return visible ? <MenuCheckboxItem {...menuProps} label={label} ref={mergedRef} /> : null;
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
